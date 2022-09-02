import { strFromU8, unzip } from 'fflate';
import fs from 'fs';
import { Browser, chromium, Page, selectors } from 'playwright';
import { ConfigService, StorageService } from '@browserbot/backend-shared';
import {
  BLEvent,
  BLInputChangeEvent,
  BLKeyboardEvent,
  BLMouseEvent,
  BLPageReferrerEvent,
  BLScrollEvent,
  BLWindowResizeEvent
} from '@browserbot/monitor/src/events';
import { BBEventWithSerializedTarget } from '@browserbot/model';
import { locatorFromTarget } from './target-matcher';

const storageService = new StorageService(new ConfigService());

declare global {
  interface Window {
    blSerializer: any;
  }
}

export class Runner {
  browser: Browser;
  page: Page;
  viewport: { width: number; height: number };
  useragent: string;
  referrer: string;
  serializerScript: string;
  uploadPath: string;
  private lastAction: BLEvent;
  private takeScreenshot: boolean;
  private speed: number = 1;
  private actionWhitelist = [
    'elementscroll',
    'keyup',
    'keydown',
    'mousemove',
    'scroll',
    'click',
    'contextmenu',
    'wait',
    'goto',
    'referrer',
    'resize',
    'device',
    'input',
    'after-response'
  ];
  private nextAction: BLEvent;

  constructor() {
    this.serializerScript = fs.readFileSync('./scripts/index.serializer.js', 'utf8');
    this.useragent =
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.88 Safari/537.36';
    this.viewport = { width: 1280, height: 619 };
    this.referrer = 'https://www.google.com/';
  }

  async runSession(path: string) {
    this.uploadPath = path.replace('.zip', '');
    const actionsZip = await storageService.read(path);
    this.browser = await chromium.launch({ channel: 'chrome', headless: false });

    unzip(new Uint8Array(actionsZip), async (err, data) => {
      for (let f in data) {
        const raw = strFromU8(data[f]);
        let jsonEvents: BLEvent[] = JSON.parse(raw);

        this.page = await (await this.setupContext(jsonEvents)).newPage();
        await this.addPositionSelector();
        await this.setInitialPage(jsonEvents);
        jsonEvents = jsonEvents.filter((e) => this.actionWhitelist.includes(e.name));
        for (let i = 0; i < jsonEvents.length; i++) {
          this.takeScreenshot = false;
          this.lastAction = jsonEvents[i - 1];
          this.nextAction = jsonEvents[i + 1];
          await this.runAction(jsonEvents[i]);
        }
        await this.browser.close().then((_) => console.log('session-ended gracefully'));
      }
    });
  }

  private async runAction(action: BLEvent | any) {
    if (this.lastAction)
      await this.page.waitForTimeout((action.timestamp - this.lastAction.timestamp) * this.speed);
    if (action.name === 'input') {
      await this.executeInput(action);
    } else if (action.name === 'mousemove') {
      await this.executeMouseMove(action);
    } else if (action.name === 'contextmenu') {
      await this.executeRightClick(action);
    } else if (action.name === 'click') {
      await this.executeClick(action);
    } else if (action.name === 'keyup') {
      await this.executeKeyUp(action);
    } else if (action.name === 'keydown') {
      await this.executeKeyDown(action);
    } else if (action.name === 'scroll') {
      await this.executeScroll(action);
    } else if (action.name === 'resize') {
      await this.executeResize(action);
    } else if (action.name === 'referrer') {
      await this.executeReferrer(action);
    } else if (action.name === 'elementscroll') {
      await this.executeElementScroll(action);
    }
    if (this.takeScreenshot) {
      /*const buffer = await this.page.screenshot();
      await storageService.upload(buffer, `${this.uploadPath}/${action.name}/${action.timestamp}`);*/
    }
  }

  private async setupContext(jsonEvents: BLEvent[]) {
    let resizeAction = jsonEvents.filter((a) => a.name === 'resize')[0] as BLWindowResizeEvent;
    let deviceAction = jsonEvents.filter((a) => a.name === 'device')[0] as BLEvent & { userAgent };
    let referrerAction = jsonEvents.filter((a) => a.name === 'referrer')[0] as BLPageReferrerEvent;
    if (resizeAction) {
      this.viewport = {
        width: resizeAction.width,
        height: resizeAction.height
      };
    }
    if (deviceAction) {
      this.useragent = deviceAction.userAgent;
    }
    if (referrerAction) {
      this.referrer = referrerAction.referrer;
    }
    return await this.browser.newContext({
      viewport: this.viewport,
      userAgent: this.useragent
    });
  }

  private async setInitialPage(jsonEvents) {
    try {
      await this.page.goto(
        (jsonEvents.filter((a) => a.name === 'referrer')[0] as BLPageReferrerEvent & { url }).url,
        {
          referer: this.referrer,
          waitUntil: 'domcontentloaded'
        }
      );
    } catch (e) {
      try {
        if (this.browser) {
          await this.browser.close();
        }
      } catch (e) {}
      throw new Error('goto action not found');
    }
  }

  private async executeMouseMove(a: BLMouseEvent) {
    await this.page.mouse.move(a.x, a.y);
    this.takeScreenshot = this.nextAction?.name != 'mousemove';
  }

  private async executeScroll(a: BLScrollEvent) {
    let coordinates = { x: a.x, y: a.y };
    await this.page.evaluate(
      (coordinates) => window.scroll(coordinates.x, coordinates.y),
      coordinates
    );
    this.takeScreenshot = true;
  }

  private async executeResize(a: BLWindowResizeEvent) {
    this.viewport = {
      width: a.width,
      height: a.height
    };
    await this.page.setViewportSize(this.viewport);
    this.takeScreenshot = true;
  }

  private async executeInput(a: BBEventWithSerializedTarget<BLInputChangeEvent>) {
    await locatorFromTarget(a.target, this.page).then(
      async (locator) => await locator.fill(a.value)
    );
    this.takeScreenshot = this.nextAction?.name != 'input';
  }

  private async executeKeyUp(a: BBEventWithSerializedTarget<BLKeyboardEvent>) {
    if (a.target.tag != 'input' || a.key == 'Enter' || a.key == 'Control' || a.modifier == 'ctrl') {
      await this.page.keyboard.up(a.key);
      this.takeScreenshot = true;
    }
  }

  private async executeKeyDown(a: BBEventWithSerializedTarget<BLKeyboardEvent>) {
    if (a.target.tag != 'input' || a.key == 'Enter' || a.key == 'Control' || a.modifier == 'ctrl') {
      await this.page.keyboard.down(a.key);
      this.takeScreenshot = false;
    }
  }

  private async executeReferrer(a: BLPageReferrerEvent & { url }) {
    await this.page.goto(a.url, {
      waitUntil: 'domcontentloaded'
    });
    this.takeScreenshot = true;
  }

  private async executeRightClick(a: BBEventWithSerializedTarget<BLMouseEvent>) {
    await locatorFromTarget(a.target, this.page).then(
      async (locator) => await locator.click({ button: 'right' })
    );
    this.takeScreenshot = true;
  }

  private async executeClick(a: BBEventWithSerializedTarget<BLMouseEvent>) {
    await locatorFromTarget(a.target, this.page).then(
      async (locator) => await locator.click({ button: 'left' })
    );
    this.takeScreenshot = true;
  }

  private async executeElementScroll(action: BBEventWithSerializedTarget<BLScrollEvent>) {
    await locatorFromTarget(action.target, this.page).then(
      async (locator) => await locator.evaluate(() => console.log('scrolling'))
    );
    this.takeScreenshot = true;
  }

  private async addPositionSelector() {
    // Must be a function that evaluates to a selector engine instance.
    const createPositionEngine = () => ({
      queryAll(root, selector: string) {
        const x = +selector.split(',')[0];
        const y = +selector.split(',')[1];
        if (root.nodeName == '#document') return [root];
        else {
          const rect = root.getBoundingClientRect();
          if (Math.round(rect.x + rect.width / 2) == x && Math.round(rect.y + rect.height / 2) == y)
            return [root];
          else return [];
        }
      }
    });
    await selectors.register('position', createPositionEngine);
  }
}
