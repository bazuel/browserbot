import { strFromU8, unzip } from 'fflate';
import fs from 'fs';
import { Browser, BrowserContext, chromium, Page, selectors } from 'playwright';
import { ConfigService, StorageService } from '@browserbot/backend-shared';
import { BLEvent, BLHTTPResponseEvent, BLWindowResizeEvent } from '@browserbot/monitor/src/events';
import { BBSessionInfo } from '@browserbot/model';
import { actionWhitelists, executeAction } from './actions';

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

  constructor() {
    this.serializerScript = fs.readFileSync('./scripts/index.serializer.js', 'utf8');
    this.useragent =
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.88 Safari/537.36';
    this.viewport = { width: 1280, height: 619 };
    this.addPositionSelector().then((_) => console.log('Context ready'));
  }

  async runSession(path: string, backendType: 'full' | 'mock') {
    this.sessionInfo.sessionPath = path.replace('.zip', '');

    const actionsZip = await storageService.read(path);
    this.browser = await chromium.launch({ channel: 'chrome', headless: false });

    unzip(new Uint8Array(actionsZip), async (err, data) => {
      for (let f in data) {
        const raw = strFromU8(data[f]);
        let jsonEvents: BLEvent[] = JSON.parse(raw);
        this.context = await this.setupContext(jsonEvents);
        this.page = await this.context.newPage();
        if (backendType == 'mock') await this.mockAllRequests(jsonEvents);
        await this.page.addInitScript(this.serializerScript);
        jsonEvents = await this.setupPage(jsonEvents, backendType);
        jsonEvents = jsonEvents.filter((e) => actionWhitelists[backendType].includes(e.name));
        for (let i = 0; i < jsonEvents.length; i++) {
          this.lastAction = jsonEvents[i - 1];
          this.nextAction = jsonEvents[i + 1];
          await this.runAction(jsonEvents[i]);
        }
        await this.concludeSession();
      }
    });
  }

  private async runAction(action: BLEvent) {
    this.takeAction = false;
    if (this.lastAction)
      await this.page.waitForTimeout(
        (action.timestamp - this.lastAction.timestamp) * (1 / this.speed)
      );
    await executeAction[action.name].apply(this, [action]);

    if (this.takeAction) {
      await this.takeShot(action);
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

  private async setupPage(jsonEvents, backendType) {
    let setupActionsName = ['referrer'];
    if (backendType == 'mock')
      setupActionsName = ['referrer', 'local-full', 'session-full', 'cookie-data'];
    let index = -1;
    let action;
    for (const actionName of setupActionsName) {
      action = jsonEvents.filter((a) => a.name === actionName)[0];
      if (action) {
        await executeAction[action.name].apply(this, [action]);
        //remove element because overhead
        index = jsonEvents.indexOf(action);
        jsonEvents.splice(index, 1);
      }
    }
    return jsonEvents;
  }

  private async takeShot(action: BLEvent) {
    this.filename = `${this.sessionInfo.sessionPath}/${action.name}/${action.timestamp}`;
    await this.page.screenshot().then((bufferScreenShot) => {
      storageService.upload(bufferScreenShot, this.filename + '.png');
    });
    this.sessionInfo.screenshots.push({
      filename: this.filename + '.png',
      dimension: this.page.viewportSize()
    });

    /*await this.takeDom().then((domJson) => {
      storageService.upload(Buffer.from(JSON.stringify(domJson)), this.filename + '.json');
    });
    this.sessionInfo.domShots.push({
      filename: this.filename + '.json'
    });*/
  }

  private async takeDom() {
    return await this.page.evaluate(() => {
      return new window.blSerializer.ElementSerializer().serialize(document);
    });
  }

  private async concludeSession() {
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

  private async mockAllRequests(jsonEvents: BLEvent[]) {
    let key;
    let responses = jsonEvents.filter((event) => event.name == 'after-response') as any;

    let requestMap: { [k: string]: any[] } = {};
    for (const { request, response, ...other } of responses) {
      key = `${request.method}.${request.url}`;
      if (!requestMap[key]) requestMap[key] = [];
      requestMap[key].push(response);
    }
    await this.page.route('*/**', (route, request) => {
      if (request.resourceType() != 'xhr' && request.resourceType() != 'fetch') route.continue();
      else {
        let response = requestMap[`${request.method()}.${request.url()}`].shift();
        let headers = {};
        Object.keys(response.headers).forEach((h) => (headers[h] = response.headers[h][0]));
        route.fulfill({
          headers: headers,
          body: response.body as string
        });
      }
    });
  }
}
