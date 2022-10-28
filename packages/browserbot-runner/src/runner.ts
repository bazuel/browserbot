import { strFromU8, unzip, Unzipped } from 'fflate';
import fs from 'fs';
import { Browser, BrowserContext, chromium, Page } from 'playwright';
import { StorageService } from '@browserbot/backend-shared';
import { BLEvent, BLWindowResizeEvent } from '@browserbot/monitor/src/events';
import { BBSessionInfo, BLSessionEvent } from '@browserbot/model';
import { actionWhitelists, executeAction } from './services/actions.service';
import { MockService } from './services/mock.service';
import { log } from './services/log.service';
import { addPositionSelector } from './functions/selector-register';
import { newTab, collectEvents, addBBObjectsToWindow } from './functions/monitor';
import { uploadEvents } from './services/uploader.service';

export class Runner {
  browser: Browser;
  page: Page;
  viewport: { width: number; height: number };
  useragent: string;
  private lastAction: BLEvent;
  private nextAction: BLEvent;
  private takeAction: boolean;
  private sessionInfo: BBSessionInfo = {
    sessionPath: '',
    screenshots: [],
    video: { filename: '' },
    domShots: []
  };
  private filename: string;
  context: BrowserContext;
  private mockService: MockService;
  backendType: 'mock' | 'full';
  private sessionType: 'normal' | 'monitoring';
  private readonly monitorScript: string;
  bbEvents: (BLEvent | BLSessionEvent)[];

  constructor(private storageService: StorageService) {
    this.monitorScript = fs.readFileSync('./scripts/index.monitor.js', 'utf8');
    this.useragent =
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.88 Safari/537.36';
    this.viewport = { width: 1280, height: 619 };
    addPositionSelector().then((_) => log('Context ready'));
  }

  async run(path: string, backendType: 'full' | 'mock') {
    this.bbEvents = [];
    this.backendType = backendType;
    this.sessionInfo.sessionPath = path.replace('.zip', '');
    const actionsZip = await this.storageService.read(path);
    unzip(new Uint8Array(actionsZip), async (err, data) => {
      await this.runSession(data, 'monitoring').catch((e) => log('runner.ts: error:', e));
      await this.uploadInfoJson();
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
        this.lastAction = jsonEvents[i - 1];
        this.nextAction = jsonEvents[i + 1];
        await this.runAction(jsonEvents[i]);
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
    if (this.sessionType == 'monitoring') await this.setupMonitor();
    jsonEvents = await this.setupPage(jsonEvents);
    if (this.page.url().includes('www.google.com/search?q='))
      await this.page.locator('button:has-text("Accetta tutto")').click();
    //TODO a volte accade che ci sia un input della sessione precedente come primo evento
    if (jsonEvents[0].name == 'input') jsonEvents.shift();
    return jsonEvents;
  }

  private async runAction(action: BLEvent) {
    log(action.name);
    this.takeAction = false;
    if (this.backendType == 'mock') this.mockService.actualTimestamp = action.timestamp;
    if (actionWhitelists[this.backendType].includes(action.name)) {
      try {
        await executeAction[action.name].apply(this, [action]);
      } catch (e) {
        await this.concludeSession();
      }
      if (this.takeAction) {
        await this.takeShot(action);
      }
    }
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
      headless: false
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
    this.filename = `${this.sessionInfo.sessionPath}/${action.name}/${action.timestamp}`;

    await this.page.screenshot().then((bufferScreenShot) => {
      this.storageService.upload(bufferScreenShot, this.filename + '.png');
    });
    this.sessionInfo.screenshots.push({
      filename: this.filename + '.png',
      dimension: this.page.viewportSize()
    });
  }

  private async concludeSession() {
    await this.page.evaluate(() => window.bb_monitorInstance.disable());
    await uploadEvents(this.page.url(), this.bbEvents);
    await this.context.close();
  }

  private async uploadInfoJson() {
    await this.storageService.upload(
      Buffer.from(JSON.stringify(this.sessionInfo)),
      `${this.sessionInfo.sessionPath}/info.json`
    );
  }

  private async setupMonitor() {
    await this.context.exposeFunction('sendTo', async (event: BLEvent | BLSessionEvent) => {
      await collectEvents.apply(this, [event]);
    });
    await this.context.exposeFunction(
      'createNewMonitor',
      async () => await addBBObjectsToWindow(this.page, this.monitorScript)
    );
    await this.context.addInitScript(() => window.createNewMonitor());
  }
}
