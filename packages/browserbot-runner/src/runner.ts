import { strFromU8, unzip, Unzipped } from 'fflate';
import fs from 'fs';
import { Browser, BrowserContext, chromium, Page, selectors } from 'playwright';
import { ConfigService, StorageService } from '@browserbot/backend-shared';
import { BLEvent, BLWindowResizeEvent } from '@browserbot/monitor/src/events';
import { BBSessionInfo } from '@browserbot/model';
import { actionWhitelists, executeAction } from './actions';
import { MockService } from './mock.service';
import { log } from './log.service';

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
  private sessionInfo: BBSessionInfo = {
    sessionPath: '',
    screenshots: [],
    video: { filename: '' },
    domShots: []
  };
  private filename: string;
  private VIDEODIR = 'videos/';
  context: BrowserContext;
  private mockService: MockService;
  backendType: 'mock' | 'full';
  private sessionType: 'video' | 'screenshot' | 'dom';

  constructor() {
    this.serializerScript = fs.readFileSync('./scripts/index.serializer.js', 'utf8');
    this.useragent =
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.88 Safari/537.36';
    this.viewport = { width: 1280, height: 619 };
    this.addPositionSelector().then((_) => log('Context ready'));
  }

  async run(path: string, backendType: 'full' | 'mock') {
    this.backendType = backendType;
    this.sessionInfo.sessionPath = path.replace('.zip', '');
    const actionsZip = await storageService.read(path);
    log('runner.ts: run: unzip');
    unzip(new Uint8Array(actionsZip), async (err, data) => {
      await this.runSession(data, 'video').catch((e) => log(e));
      await this.runSession(data, 'screenshot').catch((e) => log(e));
      await this.runSession(data, 'dom').catch((e) => log(e));
      log('runner.ts: run: jsonUpload');
      await this.uploadInfoJson();
      log('session ended gracefully');
    });
  }

  private async runSession(data: Unzipped, sessionType: 'video' | 'screenshot' | 'dom') {
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
    if (this.backendType == 'mock') jsonEvents = await this.setupMock(jsonEvents);
    jsonEvents = await this.setupPage(jsonEvents);
    await this.injectSerializerScript();
    if (this.page.url().includes('www.google.com/search?q='))
      await this.page.locator('button:has-text("Accetta tutto")').click();
    //TODO pezza
    if (jsonEvents[0].name == 'input') jsonEvents.shift();
    return jsonEvents;
  }

  private async setupMock(jsonEvents: BLEvent[]) {
    this.mockService = new MockService(this.context);
    this.mockService.actualTimestamp = jsonEvents[0].timestamp;
    await this.mockService.exposeFunctions();
    jsonEvents = await this.mockService.mockStorage(jsonEvents);
    await this.mockService.mockDate();
    await this.mockService.mockRoutes(jsonEvents);
    return jsonEvents;
  }

  private async runAction(action: BLEvent) {
    log(action.name);
    this.takeAction = false;
    if (this.backendType == 'mock') this.mockService.actualTimestamp = action.timestamp;
    if (actionWhitelists[this.backendType].includes(action.name)) {
      if (this.sessionType == 'video') await this.wait(action);
      await executeAction[action.name].apply(this, [action]);
      if (this.takeAction && this.sessionType != 'video') {
        await this.takeShot(action);
      }
    }
  }

  private async wait(action: BLEvent) {
    if (this.lastAction)
      await this.page.waitForTimeout(
        (action.timestamp - this.lastAction.timestamp) * (1 / this.speed)
      );
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
      headless: this.sessionType != 'video'
    });
    if (this.sessionType == 'video')
      return await this.browser.newContext({
        viewport: this.viewport,
        userAgent: this.useragent,
        recordVideo: this.sessionType ? { dir: this.VIDEODIR, size: this.viewport } : undefined
      });
    else
      return await this.browser.newContext({
        viewport: this.viewport,
        userAgent: this.useragent
      });
  }

  private async setupPage(jsonEvents) {
    this.page = await this.context.newPage();
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
    if (this.sessionType == 'screenshot') {
      await this.page.screenshot().then((bufferScreenShot) => {
        storageService.upload(bufferScreenShot, this.filename + '.png');
      });

      this.sessionInfo.screenshots.push({
        filename: this.filename + '.png',
        dimension: this.page.viewportSize()
      });
    } else {
      //for DOM snapshots. this.sessionType set on 'dom'
      await this.takeDom().then((domJson) => {
        storageService.upload(Buffer.from(JSON.stringify(domJson)), this.filename + '.json');
      });
      this.sessionInfo.domShots.push({
        filename: this.filename + '.json'
      });
    }
  }

  private async takeDom() {
    return await this.page.evaluate(() => {
      return new window.blSerializer.ElementSerializer().serialize(document);
    });
  }

  private async concludeSession() {
    let localPathVideo = '';
    if (this.sessionType == 'video') localPathVideo = await this.page.video().path();
    //local path inside docker container
    await this.context.close();
    if (this.sessionType == 'video') {
      this.sessionInfo.video = { filename: `${this.sessionInfo.sessionPath}.webm` };
      await this.uploadVideo(localPathVideo);
    }
  }

  private async uploadInfoJson() {
    await storageService.upload(
      Buffer.from(JSON.stringify(this.sessionInfo)),
      `${this.sessionInfo.sessionPath}/info.json`
    );
  }

  private async uploadVideo(pathVideo: string) {
    const readStream = fs.createReadStream(pathVideo);
    await storageService.upload(readStream, this.sessionInfo.video.filename);
    log('uploading ended');
    readStream.destroy();
    fs.unlink(pathVideo, (err) => {
      if (err) throw err;
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

  private async injectSerializerScript() {
    await this.page.evaluate((serializerScript) => {
      const s = document.createElement('script');
      s.textContent = serializerScript;
      document.head.appendChild(s);
    }, this.serializerScript);
  }
}
