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
  await context.exposeFunction('bb_collect', (bbEvent) => eventsCollected.push(bbEvent));
  await context.exposeFunction('bb_tabId', () => tabId);
  await context.exposeFunction('bb_sid', () => sid);
  await context.addInitScript(async () => {
    window.sendTo = async (blEvent) => {
      const tab = await window.bb_tabId();
      const sid = await window.bb_sid();
      const url = document.URL;
      const title = document.title;
      const timestamp = Date.now();
      await window.bb_collect({ ...blEvent, data: title, timestamp, tab, sid, url });
      console.log('collected', { name: blEvent.name });
      if (blEvent.name == 'referrer') {
        const cookieEvent: BLEvent = { name: 'cookie-details', type: 'cookie', timestamp };
        await window.bb_collect({ ...cookieEvent, details: document.cookie, url, sid, tab });
      }
    };
  });
  await context.addInitScript(monitorScript);
  await context.addInitScript(() => {
    window.bb_monitorInstance = new window.browserbot.SessionMonitor(window.sendTo);
    window.bb_monitorInstance.enable();
  });
}
