import { BLEvent, BLSessionEvent } from '@browserbot/model';

let sid = new Date().getTime();
let tabId = 0;
export const newTab = () => (tabId += 1);

export async function sendToBackend(blEvent: BLEvent | BLSessionEvent) {
  const tab = { id: tabId, url: this.page.url() };
  const documentTitle = await this.page.title();
  const url = tab?.url ?? '';
  const event = { ...blEvent, data: documentTitle };
  console.log('event:', event);
  this.bbEvents.push({ ...event, timestamp: Date.now(), url, sid, tab: tab.id });
  console.log('collected', { ...event, timestamp: Date.now(), url, sid, tab: tab.id });
  if (event.name == 'referrer') {
    let cookies = await this.context.cookies();
    const cookieDetailsEvent = {
      name: 'cookie-details',
      type: 'cookie',
      timestamp: Date.now(),
      details: cookies
    } as BLEvent;
    this.bbEvents.push({ ...cookieDetailsEvent, url, sid, tab: tab.id });
  }
}
