import { BLEvent, BLSessionEvent } from '@browserbot/model';

declare global {
  interface Window {
    SessionMonitor: SessionMonitor;
  }
}

interface SessionMonitor {
  //TODO è giusto?
  new (sendTo: (event: BLEvent | BLSessionEvent) => {});
  enable: () => {};
  disable: () => {};
}

const sessionMonitor: SessionMonitor = new window.SessionMonitor(sendToBackend); //TODO ho anche gli altri moduli

function enableMonitor() {
  sessionMonitor.enable();
}

function disableMonitor() {
  sessionMonitor.disable();
}

let events: BLSessionEvent[] = [];

let sid = new Date().getTime();

async function sendToBackend(blEvent: BLEvent | BLSessionEvent) {
  const event = { ...blEvent, data: document.title }; //TODO document.title funziona?
  const tab = await getCurrentTab();
  const url = tab?.url ?? '';

  events.push({ ...event, timestamp: Date.now(), url, sid, tab: tab.id });
  if (event.name == 'referrer') {
    let cookieDetailsEvent = (await getCookies()) as any;
    events.push({ ...cookieDetailsEvent, timestamp: Date.now(), url, sid, tab: tab.id });
  }
}

async function getCookies() {
  const cookieEvent = { name: 'cookie-details', type: 'cookie', details: {} };
  cookieEvent.details = document.cookie; //TODO sono i cookie che vogliamo?
  return cookieEvent;
}
async function getCurrentTab(): Promise<{ id: number; url: string }> {
  return { id: 0, url: '' }; //TODO ottenere tab id no possibile
}

export async function uploadEvents(url: string, events: BLEvent[]) {
  const zip = {} as BlobPart; //new JsonCompressor().zip(events); //TODO come zippo da playwright?
  const formData = new FormData();
  // params should be sent before files otherwise they can be null at the backend since the file was not fully loaded
  formData.append('url', url);
  formData.append('file', new Blob([zip], { type: 'application/zip' }), Date.now() + '.zip');
  fetch('http://localhost:3005/api/session/upload', {
    method: 'POST',
    body: formData
  })
    .then((resp) => resp.json())
    .then((json) => console.log(json));
}
