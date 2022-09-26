import {
  blevent,
  CookieMonitor,
  HttpMonitor,
  InputMonitor,
  InputValueMonitor,
  KeyboardMonitor,
  MouseMonitor,
  PageMonitor,
  ScrollMonitor,
  StorageMonitor,
  WindowResizeMonitor,
  getElementRect,
  getElementAttributes,
  BLEventWithTarget,
  ElementSelectorFinder,
  DomMonitor,
  ForceWebComponentsSerializationPatch,
  CssMonitor,
  MediaMonitor
} from '@browserbot/monitor';

function sendToExtension(event) {
  window.postMessage({ type: 'session-event', data: { ...event, data: document.title } }, '*');
}

const selector = (e) => {
  try {
    return new ElementSelectorFinder().findUniqueSelector(e);
  } catch {
    return '';
  }
};

export function targetToSelectors(e: BLEventWithTarget) {
  // used only for document element (scroll event)
  const targetSelector = e.target ? selector(e.target) : ''; //it's a selector. a string
  const currentTargetSelector = e.currentTarget ? selector(e.currentTarget) : ''; //it's a selector. a string
  const { target, currentTarget, ...evt } = e as any; // removes target and currentTarget from the event since we have
  return { ...evt, targetSelector, currentTargetSelector };
}

//used only for document "element" (mousescroll)
function sendEventWithTargetToExtension(event) {
  sendToExtension(targetToSelectors(event));
}

async function sendEventWithSerializedTargetToExtension(event) {
  const rect = await getElementRect(event.target);
  const attributes = getElementAttributes(event.target);
  const { target, currentTarget, ...evt } = event as any;
  sendToExtension({
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
  new WindowResizeMonitor(),
  new DomMonitor(),
  new CssMonitor(),
  new MediaMonitor()
];

Object.keys(blevent.mouse).forEach((me) => {
  if (me != 'scroll') blevent.mouse[me].on(sendEventWithSerializedTargetToExtension);
  else blevent.mouse[me].on(sendEventWithTargetToExtension);
});

blevent.media.play.on(sendEventWithSerializedTargetToExtension)
blevent.media.pause.on(sendEventWithSerializedTargetToExtension)

blevent.dom.change.on(sendToExtension);
blevent.dom.full.on(sendToExtension);
blevent.dom.css_add.on(sendEventWithSerializedTargetToExtension);
blevent.dom.css_remove.on(sendEventWithSerializedTargetToExtension);

blevent.cookie.data.on(sendToExtension);

Object.keys(blevent.keyboard).forEach((ke) => {
  blevent.keyboard[ke].on(sendEventWithSerializedTargetToExtension);
});

Object.keys(blevent.page).forEach((me) => blevent.page[me].on(sendToExtension));
Object.keys(blevent.window).forEach((me) => blevent.window[me].on(sendToExtension));
Object.keys(blevent.storage).forEach((me) => blevent.storage[me].on(sendToExtension));

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
  sendToExtension(event);
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
  sendToExtension({ ...event, response });
});

const httpMonitor = new HttpMonitor();

function enable() {
  httpMonitor.enable();
  monitors.forEach((m) => m.enable());
}

enable();

function disable() {
  httpMonitor.disable();
  monitors.forEach((m) => m.disable());
}

/*

declare global {
  interface Window {
    browserbot: { disable: () => void; version: string };
  }
}
window.browserbot = { disable, version: '1.0.6' };
 */

window.addEventListener('message', function (event) {
  if (event.data.type == 'stop-recording') disable();
});
