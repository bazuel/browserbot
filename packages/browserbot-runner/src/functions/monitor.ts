import { BLEvent, BLSessionEvent } from '@browserbot/model';
import { Page } from 'playwright';

let sid = new Date().getTime();
let tabId = 0;
export const newTab = () => {
  tabId += 1;
};

export async function collectEvents(blEvent: BLSessionEvent) {
  const tab = { id: tabId, url: this.page.url() };
  const documentTitle = await this.page.title();
  const url = tab?.url ?? '';
  const event = { ...blEvent, data: documentTitle };
  this.bbEvents.push({ ...event, timestamp: Date.now(), url, sid, tab: tab.id });
  console.log('collected', { name: event.name, sid, tab });
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

export async function addBBObjectsToWindow(page: Page, monitorScript: string) {
  await page.evaluate((script) => {
    const s = document.createElement('script');
    s.textContent = script;
    document.head.appendChild(s);
    window.bb_monitorInstance = new window.browserbot.SessionMonitor(window.sendTo);
    window.bb_monitorInstance.enable();
  }, monitorScript);
}
