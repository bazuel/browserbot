import {
  blevent,
  BLEventWithTarget,
  CookieMonitor,
  ElementSelectorFinder,
  HttpMonitor,
  InputMonitor,
  InputValueMonitor,
  KeyboardMonitor,
  MouseMonitor,
  PageMonitor,
  ScrollMonitor,
  StorageMonitor,
  WindowResizeMonitor
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
  const targetSelector = e.target ? selector(e.target) : '';
  const currentTargetSelector = e.currentTarget ? selector(e.currentTarget) : '';
  const { target, currentTarget, ...evt } = e as any; // removes target and currentTarget from the event since we have
  return { ...evt, targetSelector, currentTargetSelector };
}
function sendEventWithTargetToExtension(event) {
  sendToExtension(targetToSelectors(event));
}

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

Object.keys(blevent.mouse).forEach((me) => blevent.mouse[me].on(sendEventWithTargetToExtension));
blevent.cookie.data.on(sendToExtension);

blevent.keyboard.input.on(sendEventWithTargetToExtension);
blevent.keyboard.value.on(sendEventWithTargetToExtension);
blevent.keyboard.checked.on(sendEventWithTargetToExtension);
blevent.keyboard.up.on(sendEventWithTargetToExtension);
blevent.keyboard.down.on(sendEventWithTargetToExtension);

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
  if(event.data.type == "stop-recording")
    disable()
});
