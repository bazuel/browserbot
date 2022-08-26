import { strFromU8, unzip } from 'fflate';
import fs from 'fs';
import {
  BBAction,
  BBDeviceInformationAction,
  BBGotoAction,
  BBMouseMoveAction,
  BBReferrerAction,
  BBResizeAction,
  BBScrollAction,
  BBWaitAction
} from '@browserbot/model';
import { Browser, chromium, Page } from 'playwright';
import { ConfigService, StorageService } from '@browserbot/backend-shared';

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

  // mapAction = {
  //   mousemove: this.executeMouseMove,
  //   mousedown: this.executeMouseDown,
  //   mouseup: this.executeMouseUp,
  //   scroll: this.executeScroll,
  //   wait: this.executeWait,
  //   resize: this.executeResize,
  //   referrer: (a) => console.log('non gestito'),
  //   'after-response': (a) => console.log('non gestito'),
  //   address: (a) => console.log('non gestito'),
  //   'local-full': (a) => console.log('non gestito'),
  //   'session-full': (a) => console.log('non gestito'),
  //   input: (a) => console.log('non gestito'),
  //   value: (a) => console.log('non gestito'),
  //   visibility: (a) => console.log('non gestito')
  // };

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
        const jsonEvents: BBAction[] = JSON.parse(raw);

        this.page = await (await this.setupContext(jsonEvents)).newPage();
        await this.goto(jsonEvents);
        for (let action of jsonEvents) {
          await this.runAction(action);
        }

        // await this.concludeActions();
        await this.browser.close();
      }
    });
  }

  private async runAction(a: BBAction) {
    console.log(a);
    // await this.mapAction[a.name](a, this);
    if (a.name === 'referrer') {
      await this.executeReferrer(a);
    } else if (a.name === 'mousemove') {
      await this.executeMouseMove(a);
    } else if (a.name === 'mousedown') {
      await this.executeMouseDown(a);
    } else if (a.name === 'mouseup') {
      await this.executeMouseUp(a);
    } else if (a.name === 'scroll') {
      await this.executeScroll(a);
    } else if (a.name === 'wait') {
      await this.executeWait(a);
    } else if (a.name === 'resize') {
      await this.executeResize(a);
    } else {
      console.log(a.name, ': non gestito');
    }

    //const buffer = await this.page.screenshot();
    //await storageService.upload(buffer, `${this.uploadPath}-${a.name}`);
  }

  private async setupContext(jsonEvents) {
    if (jsonEvents.filter((a: BBAction) => a.name === 'resize')[0]) {
      this.viewport = {
        width: (jsonEvents.filter((a) => a.name === 'resize')[0] as BBResizeAction).width,
        height: (jsonEvents.filter((a) => a.name === 'resize')[0] as BBResizeAction).height
      };
    }
    if (jsonEvents.filter((a) => a.name === 'device')[0]) {
      this.useragent = (
        jsonEvents.filter((a) => a.name === 'device')[0] as BBDeviceInformationAction
      ).userAgent;
    }
    if (jsonEvents.filter((a) => a.name === 'referrer')[0]) {
      this.referrer = (
        jsonEvents.filter((a) => a.name === 'referrer')[0] as BBReferrerAction
      ).referrer;
    }
    return await this.browser.newContext({
      viewport: this.viewport,
      userAgent: this.useragent
    });
  }

  private async goto(jsonEvents) {
    try {
      await this.page.goto(
        (
          jsonEvents.filter((a) => a.name === 'goto' || a.name === 'referrer')[0] as
            | BBReferrerAction
            | BBGotoAction
        ).url,
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

  private async executeMouseMove(a: BBAction) {
    let mm = a as BBMouseMoveAction;
    // await this.page.waitForTimeout(100);
    await this.page.mouse.move(mm.x, mm.y);
  }

  private async executeMouseDown(a: BBAction) {
    await this.page.mouse.down();
  }

  private async executeMouseUp(a: BBAction) {
    await this.page.mouse.up();
  }

  private async executeScroll(a: BBAction) {
    let s = a as BBScrollAction;
    let coordinates = { x: s.x, y: s.y };
    await this.page.evaluate(
      (coordinates) => window.scroll(coordinates.x, coordinates.y),
      coordinates
    );
  }

  private async executeWait(a: BBAction) {
    await this.page.waitForTimeout((a as BBWaitAction).timeout);
  }

  private async executeResize(a: BBAction) {
    this.viewport = {
      width: (a as BBResizeAction).width,
      height: (a as BBResizeAction).height
    };
    await this.page.setViewportSize(this.viewport);
  }

  private async executeReferrer(a: BBAction) {
    let r = a as BBReferrerAction;
    await this.page.goto(r.url, {
      referer: this.referrer,
      waitUntil: 'domcontentloaded'
    });
  }

  private async concludeActions() {
    await this.page.evaluate((serializerScript) => {
      const s = document.createElement('script');
      s.textContent = serializerScript;
      document.head.appendChild(s);
    }, this.serializerScript);

    const domJson = await this.page.evaluate(() => {
      return new window.blSerializer.ElementSerializer().serialize(document);
    });
  }
}
