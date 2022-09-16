import { BrowserContext } from 'playwright';
import { BLEvent } from '@browserbot/monitor';
import { BLCookieEvent, BLStorageEvent } from '@browserbot/monitor/src/events';

export class MockService {
  private context: BrowserContext;

  constructor(context: BrowserContext) {
    this.context = context;
  }

  async mockStorage(jsonEvents: BLEvent[]) {
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

  async mockDate() {
    // Update the Date accordingly in your test pages
    await this.context.addInitScript(`{
        // Extend Date constructor to default to fakeNow
         (async() => {
              let fakeNow = await window.getActualMockedTimestamp()
              Date = class extends Date {
                constructor(...args) {
                  if (args.length === 0) {
                    super(fakeNow);
                  } else {
                    super(...args);
                  }
                }
              }
              // Override Date.now() to start from fakeNow
              const __DateNowOffset = fakeNow - Date.now();
              const __DateNow = Date.now;
              Date.now = () => __DateNow() + __DateNowOffset;
              window.setMockDateTrue()
         })()
      }`);
  }

  async mockRoutes(jsonEvents: BLEvent[]) {
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
}
