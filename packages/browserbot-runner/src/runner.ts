import { strFromU8, unzip } from 'fflate';
import fs from 'fs';
import {
  BBAction,
  BBDeviceInformationAction,
  BBGotoAction,
  BBMouseMoveAction,
  BBRefererAction,
  BBResizeAction,
  BBScrollAction,
  BBWaitAction
} from '../old/browserbot-actions.model';
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
  referer: string;
  serializerScript: string;

  mapAction = {
    mousemove: this.executeMouseMove,
    mousedown: this.executeMouseDown,
    mouseup: this.executeMouseUp,
    scroll: this.executeScroll,
    wait: this.executeWait,
    resize: this.executeResize
  };
  uploadPath: string;

  constructor() {
    this.serializerScript = fs.readFileSync('./scripts/index.serializer.js', 'utf8');
    this.useragent =
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.88 Safari/537.36';
    this.viewport = { width: 1280, height: 619 };
    this.referer = 'https://www.google.com/';
  }

  async runSession(path: string) {
    this.uploadPath = path.replace('.zip', '');
    const actionsZip = await storageService.read(path);
    this.browser = await chromium.launch({ headless: true });

    unzip(new Uint8Array(actionsZip), async (err, data) => {
      for (let f in data) {
        const raw = strFromU8(data[f]);
        const jsonEvents: BBAction[] = JSON.parse(raw);
        console.log('jsonEvents: ', jsonEvents);

        this.page = await (await this.setupContext(jsonEvents)).newPage();
        await this.goto(jsonEvents);

        for (let action of jsonEvents) {
          await this.runAction(action);
        }

        await this.concludeActions();
        await this.browser.close();
      }
    });
  }

  private async runAction(a: BBAction) {
    //await this.mapAction[a.action](a);
    console.log(a);
    //const buffer = await this.page.screenshot();
    //await storageService.upload(buffer, `${this.uploadPath}-${a.action}`);
  }

  private async setupContext(jsonEvents) {
    if (jsonEvents.filter((a) => a.action === 'resize')[0]) {
      this.viewport = {
        width: (jsonEvents.filter((a) => a.action === 'resize')[0] as BBResizeAction).width,
        height: (jsonEvents.filter((a) => a.action === 'resize')[0] as BBResizeAction).height
      };
    }
    if (jsonEvents.filter((a) => a.action === 'device')[0]) {
      this.useragent = (
        jsonEvents.filter((a) => a.action === 'device')[0] as BBDeviceInformationAction
      ).userAgent;
    }
    if (jsonEvents.filter((a) => a.action === 'referer')[0]) {
      this.referer = (
        jsonEvents.filter((a) => a.action === 'referer')[0] as BBRefererAction
      ).referer;
    }
    return await this.browser.newContext({
      viewport: this.viewport,
      userAgent: this.useragent
    });
  }

  private async goto(jsonEvents) {
    try {
      await this.page.goto((jsonEvents.filter((a) => a.action === 'goto')[0] as BBGotoAction).url, {
        referer: this.referer,
        waitUntil: 'domcontentloaded'
      });
    } catch (e) {
      throw new Error('goto action not found');
    } finally {
      if (this.browser) {
        await this.browser.close();
      }
    }
  }

  private async executeMouseMove(a: BBAction) {
    let mm = a as BBMouseMoveAction;
    let { x, y, moves } = mm;
    let prev = { x, y, at: 0 };
    let events: { x: number; y: number; at: number }[] = [];
    events.push(prev);
    for (let move of moves) {
      let next = {
        at: move.at,
        x: prev.x + move.x,
        y: prev.y + move.y
      };
      events.push(next);
      prev = next;
    }
    for (let e of events) {
      if (e.at !== 0) {
        await this.page.waitForTimeout(e.at);
      }
      await this.page.mouse.move(e.x, e.y);
    }
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

  private async concludeActions() {
    await this.page.evaluate((serializerScript) => {
      const s = document.createElement('script');
      s.textContent = serializerScript;
      document.head.appendChild(s);
    }, this.serializerScript);

    const domJson = await this.page.evaluate(() => {
      return new window.blSerializer.ElementSerializer().serialize(document);
    });
    console.log(domJson);
  }
}
