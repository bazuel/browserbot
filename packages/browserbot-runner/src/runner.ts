import { strFromU8, unzip, Unzipped } from 'fflate';
import fs from 'fs';
import { Browser, BrowserContext, chromium, Page } from 'playwright';
import { StorageService } from '@browserbot/backend-shared';
import { BLEvent, BLSessionEvent, BLWindowResizeEvent } from '@browserbot/model';
import { actionWhitelists, executeAction } from './services/actions.service';
import { MockService } from './services/mock.service';
import { log } from './services/log.service';
import { addPositionSelector } from './functions/selector-register';
import { newTab, setupMonitor } from './functions/monitor';
import { linkSessions, uploadEvents } from './services/http.service';
import { pathFromReference } from '@browserbot/common';

export class Runner {
  browser: Browser;
  page: Page;
  viewport: { width: number; height: number };
  useragent: string;
  private lastAction: BLEvent;
  private takeAction: boolean;
  private filename: string;
  context: BrowserContext;
  private mockService: MockService;
  backendType: 'mock' | 'full';
  private sessionType: 'normal' | 'monitoring';
  private readonly monitorScript: string;
  eventsCollected: BLSessionEvent[];
  private sessionReference: string;
  private speed: 1;
  private currentAction: BLEvent;

  constructor(private storageService: StorageService) {
    this.monitorScript = fs.readFileSync('./scripts/index.monitor.js', 'utf8');
    this.useragent =
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.88 Safari/537.36';
    this.viewport = { width: 1280, height: 619 };
    addPositionSelector().then((_) => log('Context ready'));
  }

  async run(reference: string, backendType: 'full' | 'mock') {
    this.eventsCollected = [];
    this.backendType = backendType;
    this.sessionReference = reference;
    const actionsZip = await this.storageService.read(
      pathFromReference(encodeURIComponent(reference))
    );
    unzip(new Uint8Array(actionsZip), async (err, data) => {
      await this.runSession(data, 'normal').catch((e) => log('runner.ts: error:', e));
      log('session ended gracefully');
    });
  }

  private async runSession(data: Unzipped, sessionType: typeof this.sessionType) {
    log('running', sessionType);
    this.sessionType = sessionType;
    for (let f in data) {
      const raw = strFromU8(data[f]);
      let jsonEvents: BLEvent[] = JSON.parse(raw);
      jsonEvents = await this.setup(jsonEvents);
      for (let i = 0; i < jsonEvents.length; i++) {
        if (actionWhitelists[this.backendType].includes(jsonEvents[i].name)) {
          this.lastAction = this.currentAction;
          this.currentAction = jsonEvents[i];
          await this.runAction(jsonEvents[i]);
        }
      }
      await this.concludeSession();
    }
  }

  private async setup(jsonEvents: BLEvent[]) {
    this.context = await this.setupContext(jsonEvents);
    if (this.backendType == 'mock') {
      this.mockService = new MockService(this.context, jsonEvents);
      jsonEvents = await this.mockService.setupMock();
    }
    if (this.sessionType == 'monitoring')
      await setupMonitor(this.context, this.eventsCollected, this.monitorScript);
    jsonEvents = await this.setupPage(jsonEvents);
    if (this.page.url().includes('www.google.com/search?q='))
      await this.page.locator('button:has-text("Accetta tutto")').click();
    //TODO a volte accade che ci sia un input della sessione precedente come primo evento
    if (jsonEvents[0].name == 'input') jsonEvents.shift();
    return jsonEvents;
  }

  private async runAction(action: BLEvent) {
    this.takeAction = false;
    if (this.backendType == 'mock') this.mockService.actualTimestamp = action.timestamp;
    try {
      if (this.lastAction)
        await this.page.waitForTimeout(
          (this.lastAction.timestamp - action.timestamp) * (1 / this.speed)
        );
      await executeAction[action.name].apply(this, [action]);
    } catch (e) {
      log('error running', action.name, e);
    }
    // if (this.sessionType == 'normal' && this.takeAction) {
    //   await this.takeShot(action);
    // }
  }

  private async setupContext(jsonEvents: BLEvent[]) {
    let resizeAction = jsonEvents.filter((a) => a.name === 'resize')[0] as BLWindowResizeEvent;
    let deviceAction = jsonEvents.filter((a) => a.name === 'device')[0] as BLEvent & { userAgent };
    if (resizeAction) {
      this.viewport = {
        width: resizeAction.width,
        height: resizeAction.height
      };
    }
    if (deviceAction) {
      this.useragent = deviceAction.userAgent;
    }
    this.browser = await chromium.launch({
      channel: 'chrome',
      headless: false,
      devtools: true
    });
    return await this.browser.newContext({
      viewport: this.viewport,
      userAgent: this.useragent
    });
  }

  private async setupPage(jsonEvents) {
    this.page = await this.context.newPage();
    newTab();
    let setupActionsName = ['referrer'];
    for (const actionName of setupActionsName) {
      let action = jsonEvents.find((a) => a.name === actionName);
      if (action) {
        await executeAction[action.name].apply(this, [action]);
      }
    }
    return jsonEvents;
  }

  private async takeShot(action: BLEvent) {
    this.filename = `${this.sessionReference}/${action.name}/${action.timestamp}`;
    await this.page.screenshot().then((bufferScreenShot) => {
      this.storageService.upload(bufferScreenShot, this.filename + '.png');
    });
  }

  private async concludeSession() {
    if (this.sessionType == 'monitoring') {
      await this.page.evaluate(() => window.bb_monitorInstance.disable());
      const newReference = await uploadEvents(this.page.url(), this.eventsCollected);
      await linkSessions(this.sessionReference, newReference);
    }
    await this.context.close();
  }
}
