import {
  BLCookieEvent,
  BLEvent,
  BLEventName,
  BLInputChangeEvent,
  BLKeyboardEvent,
  BLMouseEvent,
  BLPageReferrerEvent,
  BLScrollEvent,
  BLStorageEvent,
  BLWindowResizeEvent
} from '@browserbot/monitor/src/events';
import { BBEventWithSerializedTarget } from '@browserbot/model';
import { locatorFromTarget } from './target-matcher';
import { BLHTTPResponseEvent } from '@browserbot/monitor/src/http.event';

export const actionWhitelists: { [k: string]: BLEventName[] } = {
  full: [
    'mousedown',
    'mouseup',
    'elementscroll',
    'keyup',
    'keydown',
    'mousemove',
    'scroll',
    'contextmenu',
    'resize',
    'input'
  ],
  mock: [
    'mousedown',
    'mouseup',
    'elementscroll',
    'keyup',
    'keydown',
    'mousemove',
    'scroll',
    'contextmenu',
    //'referrer',
    'resize',
    'input'
    //'after-response',
    //'local-full',
    //'session-full',
    //'cookie-data'
  ]
};

export const executeAction: Partial<{ [k in BLEventName]: (a: BLEvent) => Promise<any> }> = {
  mousedown: executeMouseDown,
  mouseup: executeMouseUp,
  elementscroll: executeElementScroll,
  keyup: executeKeyUp,
  keydown: executeKeyDown,
  mousemove: executeMouseMove,
  scroll: executeScroll,
  contextmenu: executeRightClick,
  referrer: executeReferrer,
  resize: executeResize,
  input: executeInput,
  'local-full': setLocalStorage,
  'session-full': setSessionStorage,
  'cookie-data': setCookie,
  'after-response': executeRequest
};

export async function executeMouseMove(a: BLMouseEvent) {
  await this.page.mouse.move(a.x, a.y);
  this.takeAction = false;
}

export async function executeScroll(a: BLScrollEvent) {
  let coordinates = { x: a.x, y: a.y };
  await this.page.evaluate(
    (coordinates) => window.scroll(coordinates.x, coordinates.y),
    coordinates
  );
  this.takeAction = false;
}

export async function executeResize(a: BLWindowResizeEvent) {
  this.viewport = {
    width: a.width,
    height: a.height
  };
  await this.page.setViewportSize(this.viewport);
  this.takeAction = true;
}

export async function executeInput(a: BBEventWithSerializedTarget<BLInputChangeEvent>) {
  await locatorFromTarget(a.target, this.page).then(async (locator) => await locator.fill(a.value));
  this.takeAction = this.nextAction?.name != 'input';
}

export async function executeKeyUp(a: BBEventWithSerializedTarget<BLKeyboardEvent>) {
  if (a.target.tag != 'input' || a.key == 'Enter' || a.key == 'Control' || a.modifier == 'ctrl') {
    await this.page.keyboard.up(a.key);
    this.takeAction = false;
  }
}

export async function executeKeyDown(a: BBEventWithSerializedTarget<BLKeyboardEvent>) {
  if (a.target.tag != 'input' || a.key == 'Enter' || a.key == 'Control' || a.modifier == 'ctrl') {
    await this.page.keyboard.down(a.key);
    this.takeAction = false;
  }
}

export async function executeReferrer(a: BLPageReferrerEvent) {
  //this method will be executed only once, during setupPage!
  await this.page.goto(a.url, {
    referer: 'www.google.com',
    waitUntil: 'domcontentloaded'
  });
  this.takeAction = true;
}

export async function executeRightClick(a: BBEventWithSerializedTarget<BLMouseEvent>) {
  await this.page.mouse.click(a.x, a.y, { button: 'right' });
  this.takeAction = true;
}

export async function executeMouseDown(a) {
  await this.page.mouse.down();
  this.takeAction = false;
}

export async function executeMouseUp(a) {
  await this.page.mouse.up();
  this.takeAction = true;
}

export async function executeElementScroll(action: BBEventWithSerializedTarget<BLScrollEvent>) {
  await locatorFromTarget(action.target, this.page).then(async (locator) =>
    locator.evaluate((elem, action) => elem.scroll(action.x, action.y), action)
  );
  this.takeAction = true;
}

export async function executeRequest(action: BLHTTPResponseEvent) {
  let requestContext = this.page.request;
  let request = action.request;
  let headers = {};
  Object.keys(action.request.headers).forEach((h) => (headers[h] = action.request.headers[h][0]));
  headers['timestamp-mock-browserbot'] = action.request.timestamp.toString();
  console.log(action.request.url);
  if (action.request.method == 'GET') {
    return await requestContext.get(request.url, {
      headers: headers
    });
  } else if (action.request.method == 'POST') {
    return await requestContext.post(request.url, {
      data: request.body,
      headers: headers
    });
    /*} else if (action.request.method == 'DELETE') {
      console.log(action.request.method + "not handled")
    } else if (action.request.method == 'PUT') {
      console.log(action.request.method + "not handled")
    } else if (action.request.method == 'FETCH') {
      console.log(action.request.method + "not handled")
    } else {
      console.log(action.request.method + "not handled")*/
  }
}

export async function setLocalStorage(action: BLStorageEvent) {
  let storage = action.storage;
  for (const key in storage) {
    let value = storage[key];
    await this.page.evaluate((obj) => localStorage.setItem(obj.key, obj.value), { key, value });
  }
}

export async function setSessionStorage(action: BLStorageEvent) {
  let storage = action.storage;
  for (const key in storage) {
    let value = storage[key];
    await this.page.evaluate((obj) => sessionStorage.setItem(obj.key, obj.value), { key, value });
  }
}

export async function setCookie(action: BLCookieEvent) {
  for (const cookie of action.cookie.split(';')) {
    await this.page.evaluate((cookie) => (document.cookie = cookie), cookie);
  }
}
