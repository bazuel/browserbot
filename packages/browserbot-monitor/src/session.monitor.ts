import { MouseMonitor } from './mouse.monitor';
import { CookieMonitor } from './cookie.monitor';
import { InputMonitor } from './input.monitor';
import { InputValueMonitor } from './input-value.monitor';
import { KeyboardMonitor } from './keyboard.monitor';
import { PageMonitor } from './page.monitor';
import { ScrollMonitor } from './scroll.monitor';
import { StorageMonitor } from './storage.monitor';
import { WindowResizeMonitor } from './window-resize.monitor';
import { blevent } from './dispatched.events';
import { ElementSelectorFinder } from './selector-finder.util';
import { HttpMonitor } from './http.monitor';
import { getElementRect, getElementAttributes } from './serialize-target';
import { DomMonitor } from './dom/dom.monitor';
import { CssMonitor } from './dom/css.monitor';
import { MediaMonitor } from './dom/media.monitor';
import { ForceWebComponentsSerializationPatch } from './dom/force-web-components-serialization.patch';
import { BLSessionEvent, BLEventWithTarget, BLEvent } from './events';

const state: { sendTo: (event: BLEvent | BLSessionEvent) => void } = { sendTo: () => {} };

const selector = (e) => {
  try {
    return new ElementSelectorFinder().findUniqueSelector(e);
  } catch {
    return '';
  }
};

function targetToSelectors(e: BLEventWithTarget) {
  // used only for document element (scroll event)
  const targetSelector = e.target ? selector(e.target) : ''; //it's a selector. a string
  const currentTargetSelector = e.currentTarget ? selector(e.currentTarget) : ''; //it's a selector. a string
  const { target, currentTarget, ...evt } = e as any; // removes target and currentTarget from the event since we have
  return { ...evt, targetSelector, currentTargetSelector };
}

//used only for document "element" (mousescroll)
function sendEventWithTargetToExtension(event) {
  state.sendTo(targetToSelectors(event));
}

async function sendEventWithSerializedTargetToExtension(event) {
  const rect = await getElementRect(event.target);
  const attributes = getElementAttributes(event.target);
  const { target, currentTarget, ...evt } = event as any;
  state.sendTo({
    ...evt,
    target: {
      rect,
      attributes,
      tag: event.target.tagName,
      innerText: event.target.innerText ?? ''
    }
  });
}

new ForceWebComponentsSerializationPatch().apply();
const monitors = [
  new MouseMonitor(),
  new CookieMonitor(),
  new InputMonitor(),
  new InputValueMonitor(),
  new KeyboardMonitor(),
  new PageMonitor(),
  new ScrollMonitor(),
  new StorageMonitor(),
  new WindowResizeMonitor()
];

const delayedMonitors = [new DomMonitor(), new CssMonitor(), new MediaMonitor()];

Object.keys(blevent.mouse).forEach((me) => {
  if (me != 'scroll') blevent.mouse[me].on(sendEventWithSerializedTargetToExtension);
  else blevent.mouse[me].on(sendEventWithTargetToExtension);
});

blevent.media.play.on(sendEventWithSerializedTargetToExtension);
blevent.media.pause.on(sendEventWithSerializedTargetToExtension);

blevent.dom.change.on(state.sendTo);
blevent.dom.full.on(state.sendTo);
blevent.dom.css_add.on(sendEventWithSerializedTargetToExtension);
blevent.dom.css_remove.on(sendEventWithSerializedTargetToExtension);

blevent.cookie.data.on(state.sendTo);

Object.keys(blevent.keyboard).forEach((ke) => {
  blevent.keyboard[ke].on(sendEventWithSerializedTargetToExtension);
});

Object.keys(blevent.page).forEach((me) => blevent.page[me].on(state.sendTo));
Object.keys(blevent.window).forEach((me) => blevent.window[me].on(state.sendTo));
Object.keys(blevent.storage).forEach((me) => blevent.storage[me].on(state.sendTo));

const httpData = (e) => {
  const headers = e.request.headers;
  const method = e.request.method;
  const path = e.request.path;
  const timestamp = e.request.timestamp;
  const url = e.request.url;
  const body = e.request.body;
  const request = {
    headers,
    method,
    path,
    timestamp,
    url,
    body
  };
  let he = {
    name: e.name,
    type: e.type,
    timestamp: e.timestamp,
    request,
    status: e.target?.status
  };
  return he;
};

const errorHandler = (e) => {
  let event = httpData(e);
  state.sendTo(event);
};
blevent.http.error.on(errorHandler);
blevent.http.abort.on(errorHandler);
blevent.http.after_response.on((e) => {
  let event = httpData(e);
  let response = {
    body: e.body,
    headers: e.headers,
    status: e.status,
    timestamp: e.timestamp
  };
  state.sendTo({ ...event, response });
});

const httpMonitor = new HttpMonitor();

export class SessionMonitor {
  constructor(sendTo: typeof state['sendTo']) {
    state.sendTo = sendTo;
  }

  enable() {
    httpMonitor.enable();
    monitors.forEach((m) => m.enable());
    setTimeout(() => {
      delayedMonitors.forEach((m) => m.enable());
    }, 1000);
  }

  disable() {
    httpMonitor.disable();
    monitors.forEach((m) => m.disable());
    delayedMonitors.forEach((m) => m.disable());
  }
}
