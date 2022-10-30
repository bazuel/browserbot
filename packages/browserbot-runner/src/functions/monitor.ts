import { BLEvent, BLSessionEvent } from '@browserbot/model';
import { BrowserContext, Page } from 'playwright';
import { log } from '../services/log.service';

let sid = new Date().getTime();
let tabId = 0;
export const newTab = () => {
  tabId += 1;
};

export async function collectEvents(
  page: Page,
  context: BrowserContext,
  collectedEvents: BLSessionEvent[],
  blEvent: BLEvent
) {
  //TODO perdo il contesto della page
  let documentTitle = '';
  let tab = { id: tabId, url: page.url() };
  try {
    documentTitle = await page.title();
  } catch (e) {
    log('dom-full-error:', blEvent.name, e);
  }
  const url = tab?.url ?? '';
  const event = { ...blEvent, data: documentTitle };
  collectedEvents.push({ ...event, timestamp: Date.now(), url, sid, tab: tab.id });
  console.log('collected', { name: event.name, sid, tab });
  if (event.name == 'referrer') {
    let cookies = await context.cookies();
    const cookieDetailsEvent = {
      name: 'cookie-details',
      type: 'cookie',
      timestamp: Date.now(),
      details: cookies
    } as BLEvent;
    collectedEvents.push({ ...cookieDetailsEvent, url, sid, tab: tab.id });
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

export async function setupMonitor(
  page: Page,
  context: BrowserContext,
  eventsCollected: BLSessionEvent[],
  monitorScript: string
) {
  await context.exposeFunction(
    'sendTo',
    async (event: BLSessionEvent) => await collectEvents(page, context, eventsCollected, event)
  );
  await context.exposeFunction(
    'createNewMonitor',
    async () => await addBBObjectsToWindow(page, monitorScript)
  );
  await this.context.addInitScript(() => window.createNewMonitor());
}
