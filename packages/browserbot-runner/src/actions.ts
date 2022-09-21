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
import { log } from './log.service';

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
    'resize'
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
    'resize',
    'input'
  ]
};

export const executeAction: Partial<{ [k in BLEventName]: ((a: BLEvent) => Promise<any>) | null }> =
  {
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
    'cookie-data': setCookie
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
  //TODO: keyup/keydown quando input non trova elemento.
  if (!this.lastAction.name.includes('key') && !this.nextAction.name.includes('key')) {
    await locatorFromTarget(a.target, this.page).then(async (locator) => {
      let missingTextLength = a.value.length - (await locator.inputValue()).length;
      if (missingTextLength >= 2) {
        log('filling text due to autocomplete');
        await locator.fill(a.value, { timeout: 1000 }).catch(async () => {
          for (const word of a.value.slice(-missingTextLength)) {
            await executeAction.keydown.apply(this, [{ key: word }]);
            await executeAction.keyup.apply(this, [{ key: word }]);
          }
          log('switch from input to key:', a.value);
        });
      }
    });
  }
  this.takeAction = this.nextAction?.name != 'input';
}

export async function executeKeyUp(a: BBEventWithSerializedTarget<BLKeyboardEvent>) {
  await this.page.keyboard.up(a.key).catch(() => log('Unknown key:', a.key));
  this.takeAction = false;
}

export async function executeKeyDown(a: BBEventWithSerializedTarget<BLKeyboardEvent>) {
  //TODO: inserimento manuale della chiocciola
  if (a.key == '@') await this.page.keyboard.insertText('@');
  await this.page.keyboard.down(a.key).catch(async () => {
    await this.page.keyboard.insertText(a.key);
  });
  this.takeAction = false;
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

export async function executeMouseDown() {
  await this.page.mouse.down();
  this.takeAction = false;
}

export async function executeMouseUp() {
  await this.page.mouse.up();
  this.takeAction = true;
}

export async function executeElementScroll(action: BBEventWithSerializedTarget<BLScrollEvent>) {
  await locatorFromTarget(action.target, this.page).then(async (locator) =>
    locator.evaluate((elem, action) => elem.scroll(action.x, action.y), action)
  );
  this.takeAction = true;
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
