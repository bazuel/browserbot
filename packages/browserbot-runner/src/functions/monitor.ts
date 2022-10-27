import { BLEvent, BLSessionEvent } from '@browserbot/model';

export async function sendToBackend(blEvent: BLEvent | BLSessionEvent) {
  const event = { ...blEvent, data: document.title };
  const sid = await window.getSid();
  const tab = await window.getTab();
  const url = tab?.url ?? '';
  console.log('event:', event);
  window.bb_events.push({ ...event, timestamp: Date.now(), url, sid, tab: tab.id });
  console.log('collected', { ...event, timestamp: Date.now(), url, sid, tab: tab.id });
  if (event.name == 'referrer') {
    const cookieDetailsEvent = {
      name: 'cookie-details',
      type: 'cookie',
      timestamp: Date.now(),
      details: document.cookie
    } as BLEvent;
    window.bb_events.push({ ...cookieDetailsEvent, url, sid, tab: tab.id });
  }
}
