import { strFromU8, unzip } from 'fflate';
import fs from 'fs';
import { Browser, BrowserContext, chromium, Page, selectors } from 'playwright';
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
import { BBEventWithSerializedTarget, BBSessionInfo } from '@browserbot/model';
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
  serializerScript: string;
  private lastAction: BLEvent;
  private nextAction: BLEvent;
  private takeAction: boolean;
  private speed: number = 1;
  private actionWhitelist: BLEvent['name'][] = [
    'mousedown',
    'mouseup',
    'elementscroll',
    'keyup',
    'keydown',
    'mousemove',
    'scroll',
    'click',
    'contextmenu',
    'referrer',
    'resize',
    'device',
    'input',
    'after-response'
  ];
  private sessionInfo: BBSessionInfo = {
    sessionPath: '',
    screenshots: [],
    video: { filename: '' },
    domShots: []
  };
  private filename: string;
  private VIDEODIR = 'videos/';
  private context: BrowserContext;

  constructor() {
    this.serializerScript = fs.readFileSync('./scripts/index.serializer.js', 'utf8');
    this.useragent =
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.88 Safari/537.36';
    this.viewport = { width: 1280, height: 619 };
    this.addPositionSelector().then((_) => console.log('Context ready'));
  }

  async runSession(path: string) {
    this.sessionInfo.sessionPath = path.replace('.zip', '');

    const actionsZip = await storageService.read(path);
    this.browser = await chromium.launch({ channel: 'chrome', headless: false });

    unzip(new Uint8Array(actionsZip), async (err, data) => {
      for (let f in data) {
        const raw = strFromU8(data[f]);
        let jsonEvents: BLEvent[] = JSON.parse(raw);

        this.context = await this.setupContext(jsonEvents);
        this.page = await this.context.newPage();
        await this.page.addInitScript(this.serializerScript);
        await this.setInitialPage(jsonEvents);
        jsonEvents = jsonEvents.filter((e) => this.actionWhitelist.includes(e.name));
        for (let i = 0; i < jsonEvents.length; i++) {
          this.lastAction = jsonEvents[i - 1];
          this.nextAction = jsonEvents[i + 1];
          await this.runAction(jsonEvents[i]);
        }

        storageService.upload(
          Buffer.from(JSON.stringify(this.sessionInfo)),
          `${this.sessionInfo.sessionPath}/info.json`
        );
        let pathVideo = await this.page.video().path();

        this.sessionInfo.video = { filename: `${this.sessionInfo.sessionPath}.webm` };
        await this.context.close();
        console.log('session ended gracefully');
        const readStream = fs.createReadStream(pathVideo);
        await storageService.upload(readStream, this.sessionInfo.video.filename);
        console.log('uploading ended');
        readStream.destroy();
        fs.unlink(pathVideo, (err) => {
          if (err) throw err;
        });
        console.log(this.sessionInfo);
      }
    });
  }

  private async runAction(action: BLEvent | any) {
    this.takeAction = false;
    if (this.lastAction)
      await this.page.waitForTimeout((action.timestamp - this.lastAction.timestamp) * this.speed);
    if (action.name === 'input') {
      await this.executeInput(action);
    } else if (action.name === 'mousemove') {
      await this.executeMouseMove(action);
    } else if (action.name === 'contextmenu') {
      await this.executeRightClick(action);
    } else if (action.name === 'mousedown') {
      await this.executeMouseDown();
    } else if (action.name === 'mouseup') {
      await this.executeMouseUp();
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
    if (this.takeAction) {
      this.filename = `${this.sessionInfo.sessionPath}/${action.name}/${action.timestamp}`;
      /*await this.page.screenshot().then((bufferScreenShot) => {
        storageService.upload(bufferScreenShot, this.filename + '.png');
      });*/
      this.sessionInfo.screenshots.push({
        filename: this.filename + '.png',
        dimension: this.page.viewportSize()
      });

      /*await this.takeDom().then((domJson) => {
        storageService.upload(Buffer.from(JSON.stringify(domJson)), this.filename + '.json');
      });*/
      this.sessionInfo.domShots.push({
        filename: this.filename + '.json'
      });
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
    return await this.browser.newContext({
      viewport: this.viewport,
      userAgent: this.useragent,
      recordVideo: { dir: this.VIDEODIR, size: this.viewport }
    });
  }

  private async setInitialPage(jsonEvents) {
    const action = jsonEvents.filter((a) => a.name === 'referrer')[0];
    await this.executeReferrer(action);
  }

  private async executeMouseMove(a: BLMouseEvent) {
    await this.page.mouse.move(a.x, a.y);
    this.takeAction = false;
  }

  private async executeScroll(a: BLScrollEvent) {
    let coordinates = { x: a.x, y: a.y };
    await this.page.evaluate(
      (coordinates) => window.scroll(coordinates.x, coordinates.y),
      coordinates
    );
    this.takeAction = false;
  }

  private async executeResize(a: BLWindowResizeEvent) {
    this.viewport = {
      width: a.width,
      height: a.height
    };
    await this.page.setViewportSize(this.viewport);
    this.takeAction = true;
  }

  private async executeInput(a: BBEventWithSerializedTarget<BLInputChangeEvent>) {
    await locatorFromTarget(a.target, this.page).then(
      async (locator) => await locator.fill(a.value)
    );
    this.takeAction = this.nextAction?.name != 'input';
  }

  private async executeKeyUp(a: BBEventWithSerializedTarget<BLKeyboardEvent>) {
    if (a.target.tag != 'input' || a.key == 'Enter' || a.key == 'Control' || a.modifier == 'ctrl') {
      await this.page.keyboard.up(a.key);
      this.takeAction = false;
    }
  }

  private async executeKeyDown(a: BBEventWithSerializedTarget<BLKeyboardEvent>) {
    if (a.target.tag != 'input' || a.key == 'Enter' || a.key == 'Control' || a.modifier == 'ctrl') {
      await this.page.keyboard.down(a.key);
      this.takeAction = false;
    }
  }

  private async executeReferrer(a: BLPageReferrerEvent) {
    await this.page.goto(a.url, {
      referer: 'www.google.com',
      waitUntil: 'domcontentloaded'
    });
    this.takeAction = true;
  }

  private async executeRightClick(a: BBEventWithSerializedTarget<BLMouseEvent>) {
    await this.page.mouse.click(a.x, a.y, { button: 'right' });
    this.takeAction = true;
  }

  private async executeMouseDown() {
    await this.page.mouse.down();
    this.takeAction = false;
  }

  private async executeMouseUp() {
    await this.page.mouse.up();
    this.takeAction = true;
  }

  private async executeElementScroll(action: BBEventWithSerializedTarget<BLScrollEvent>) {
    await locatorFromTarget(action.target, this.page).then(async (locator) =>
      locator.evaluate((elem, action) => elem.scroll(action.x, action.y), action)
    );
    this.takeAction = true;
  }

  private async takeDom() {
    return await this.page.evaluate(() => {
      return new window.blSerializer.ElementSerializer().serialize(document);
    });
  }

  private async addPositionSelector() {
    // Must be a function that evaluates to a selector engine instance.
    const createPositionEngine = () => ({
      queryAll(root: Element, selector: string) {
        const rect = root.getBoundingClientRect();
        const x = +selector.split(',')[0];
        const y = +selector.split(',')[1];
        const width = +selector.split(',')[2];
        const height = +selector.split(',')[3];
        const topLeft1 = [x, y];
        const bottomRight1 = [x + width, y + height];
        const topLeft2 = [rect.left, rect.top];
        const bottomRight2 = [rect.right, rect.bottom];
        if (root.nodeName == '#document') return [root];
        else {
          if (topLeft1[0] > bottomRight2[0] || topLeft2[0] > bottomRight1[0]) {
            return [];
          }
          if (topLeft1[1] > bottomRight2[1] || topLeft2[1] > bottomRight1[1]) {
            return [];
          }
          if (
            Math.round(rect.height) == Math.round(height) &&
            Math.round(rect.width) == Math.round(width)
          )
            return [root];
          else return [];
        }
      }
    });
    await selectors.register('position', createPositionEngine);
  }
}
