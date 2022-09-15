import { strFromU8, unzip } from 'fflate';
import fs from 'fs';
import { Browser, BrowserContext, chromium, Page, selectors } from 'playwright';
import { ConfigService, StorageService } from '@browserbot/backend-shared';
import {
  BLCookieEvent,
  BLEvent,
  BLStorageEvent,
  BLWindowResizeEvent
} from '@browserbot/monitor/src/events';
import { BBSessionInfo } from '@browserbot/model';
import { actionWhitelists, executeAction } from './actions';

const storageService = new StorageService(new ConfigService());

declare global {
  interface Window {
    blSerializer: any;
    __browserbot: { dataMocked: boolean; storageMocked: boolean };
    controlMock: () => Promise<{ date: boolean; storage: boolean }>;
    setMockDateTrue: () => void;
    setMockStorageTrue: () => void;
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
  mocked: { date: boolean; storage: boolean };

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
    this.mocked = { date: false, storage: false };

    unzip(new Uint8Array(actionsZip), async (err, data) => {
      for (let f in data) {
        const raw = strFromU8(data[f]);
        let jsonEvents: BLEvent[] = JSON.parse(raw);
        this.context = await this.setupContext(jsonEvents);
        await this.exposeFunctions();
        //await this.context.addInitScript(this.serializerScript);
        if (backendType == 'mock') {
          jsonEvents = await this.mockStorage(jsonEvents);
          //1663168825112 - 2 * 86400000
          await this.mockDate(1);
          await this.mockRoutes(jsonEvents);
        }
        this.page = await this.context.newPage();
        jsonEvents = await this.setupPage(jsonEvents);
        jsonEvents = jsonEvents.filter((e) => actionWhitelists[backendType].includes(e.name));
        for (let i = 0; i < jsonEvents.length; i++) {
          this.lastAction = jsonEvents[i - 1];
          this.nextAction = jsonEvents[i + 1];
          await this.runAction(jsonEvents[i]);
        }
        //await this.concludeSession();
      }
    });
  }

  private async exposeFunctions() {
    await this.context.exposeFunction('controlMock', () => this.mocked);
    await this.context.exposeFunction('setMockDateTrue', () => (this.mocked.date = true));
    await this.context.exposeFunction('setMockStorageTrue', () => (this.mocked.storage = true));
  }

  private async runAction(action: BLEvent) {
    await this.page.evaluate(() => console.log(Date.now()));
    console.log(await this.page.evaluate(() => window.controlMock()));

    this.takeAction = false;
    await this.wait(action);
    await executeAction[action.name].apply(this, [action]);
    if (this.takeAction) {
      await this.takeShot(action);
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
    return await this.browser.newContext({
      viewport: this.viewport,
      userAgent: this.useragent,
      recordVideo: { dir: this.VIDEODIR, size: this.viewport }
    });
  }

  private async setupPage(jsonEvents) {
    let setupActionsName = ['referrer'];
    for (const actionName of setupActionsName) {
      let action = jsonEvents.filter((a) => a.name === actionName)[0];
      if (action) {
        await executeAction[action.name].apply(this, [action]);
        jsonEvents.splice(jsonEvents.indexOf(action), 1);
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
    //for DOM snapshots
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
    await this.uploadInfoJson();
    let localPathVideo = await this.page.video().path(); //local path inside docker container
    await this.context.close();
    console.log('session ended gracefully');
    await this.uploadVideo(localPathVideo);
  }

  private async uploadInfoJson() {
    this.sessionInfo.video = { filename: `${this.sessionInfo.sessionPath}.webm` };
    await storageService.upload(
      Buffer.from(JSON.stringify(this.sessionInfo)),
      `${this.sessionInfo.sessionPath}/info.json`
    );
  }

  private async uploadVideo(pathVideo: string) {
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

  private async mockRoutes(jsonEvents: BLEvent[]) {
    let key;
    let responses = jsonEvents.filter((event) => event.name == 'after-response') as any;
    let requestMap: { [k: string]: any[] } = {};
    for (const { request, response } of responses) {
      key = `${request.method}.${request.url}`;
      if (!requestMap[key]) requestMap[key] = [];
      requestMap[key].push(response);
    }
    await this.context.route('*/**', async (route, request) => {
      if (
        (request.resourceType() == 'xhr' || request.resourceType() == 'fetch') &&
        requestMap[`${request.method()}.${request.url()}`] &&
        requestMap[`${request.method()}.${request.url()}`].length
      ) {
        let response = requestMap[`${request.method()}.${request.url()}`].shift();
        let headers = {};
        Object.keys(response.headers).forEach((h) => (headers[h] = response.headers[h]));
        await route.fulfill({
          headers: headers,
          body: response.body as string,
          status: response.status
        });
      } else {
        await route.continue();
      }
    });
  }

  private async mockDate(timestamp: number) {
    // Pick the new/fake "now" for you test pages.
    const fakeNow = timestamp;

    // Update the Date accordingly in your test pages
    await this.context.addInitScript(`{
        // Extend Date constructor to default to fakeNow
        Date = class extends Date {
          constructor(...args) {
            if (args.length === 0) {
              super(${fakeNow});
            } else {
              super(...args);
            }
          }
        }
        // Override Date.now() to start from fakeNow
        const __DateNowOffset = ${fakeNow} - Date.now();
        const __DateNow = Date.now;
        Date.now = () => __DateNow() + __DateNowOffset;
      }`);
  }

  private async mockStorage(jsonEvents: BLEvent[]) {
    let data: {
      cookies?: string;
      localStorage?: { [k: string]: string };
      sessionStorage?: { [k: string]: string };
    } = {};
    let cookieAction = jsonEvents.filter((ev) => ev.name == 'cookie-data')[0] as BLCookieEvent;
    if (cookieAction) {
      jsonEvents.splice(jsonEvents.indexOf(cookieAction), 1);
      data.cookies = cookieAction.cookie;
    }
    let localStorageAction = jsonEvents.filter(
      (ev) => ev.name == 'local-full'
    )[0] as BLStorageEvent;
    if (localStorageAction) {
      jsonEvents.splice(jsonEvents.indexOf(localStorageAction), 1);
      data.localStorage = localStorageAction.storage;
    }
    let sessionStorageAction = jsonEvents.filter(
      (ev) => ev.name == 'session-full'
    )[0] as BLStorageEvent;
    if (sessionStorageAction) {
      jsonEvents.splice(jsonEvents.indexOf(sessionStorageAction), 1);
      data.sessionStorage = sessionStorageAction.storage;
    }
    await this.context.addInitScript(async (data) => {
      if (!(await window.controlMock()).storage) {
        let mockData = data;
        if (mockData.cookies) {
          for (const cookie of mockData.cookies.split(';')) {
            document.cookie = cookie;
          }
        }
        for (const key in mockData.localStorage) {
          localStorage.setItem(key, mockData.localStorage[key]);
        }
        for (const key in mockData.sessionStorage) {
          sessionStorage.setItem(key, mockData.sessionStorage[key]);
        }
        window.setMockStorageTrue();
      }
    }, data);
    return jsonEvents;
  }
}
