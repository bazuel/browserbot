import { BLEvent, BLSessionEvent } from '@browserbot/model';
import { BrowserContext } from 'playwright';

let sid = new Date().getTime();
let tabId = 0;
export const newTab = () => {
  tabId += 1;
};

export async function setupMonitor(
  context: BrowserContext,
  eventsCollected: BLSessionEvent[],
  monitorScript: string
) {
  await context.exposeFunction('bb_get', (bbEvent) => eventsCollected.push(bbEvent));
  await context.exposeFunction('bb_tabId', () => tabId);
  await context.exposeFunction('bb_sid', () => sid);
  await context.addInitScript(() => {
    window.sendTo = async (blEvent) => {
      let documentTitle = '';
      let tabId = await window.bb_tabId();
      let sid = await window.bb_sid();
      let tab = { id: tabId, url: document.URL };
      try {
        documentTitle = document.title;
      } catch (e) {
        console.log('dom-full-error:', blEvent.name, e);
      }
      const url = tab?.url ?? '';
      const event = { ...blEvent, data: documentTitle };
      await window.bb_get({ ...event, timestamp: Date.now(), url, sid, tab: tab.id });
      console.log('collected', { name: event.name, sid, tab });
      if (event.name == 'referrer') {
        let cookies = document.cookie;
        const cookieDetailsEvent = {
          name: 'cookie-details',
          type: 'cookie',
          timestamp: Date.now(),
          details: cookies
        } as BLEvent;
        await window.bb_get({ ...cookieDetailsEvent, url, sid, tab: tab.id });
      }
    };
  });
  await context.addInitScript(monitorScript);
  await context.addInitScript(() => {
    window.bb_monitorInstance = new window.browserbot.SessionMonitor(window.sendTo);
    window.bb_monitorInstance.enable();
  });
}
