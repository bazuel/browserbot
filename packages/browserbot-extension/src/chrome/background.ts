import { disableRecordingIcon, enableRecordingIcon } from './ui/recording-icon';
import { BLEvent } from '@browserbot/monitor';
import { getCurrentTab } from './current-tab.util';
import { isRecording, setRecording } from './recording.state';
import { uploadEvents } from './upload.api';

let cookieDetailsEvent: any = {};
let events: BLEvent[] = [];

(async () => {
  let sid = await chrome.storage.local.get('sid');
  if (!sid['sid']) {
    await chrome.storage.local.set({ sid: new Date().getTime() });
  }
})();

chrome.runtime.onMessage.addListener(async function (request, sender, sendResponse) {
  const sid = (await chrome.storage.local.get('sid'))['sid'];
  if (request.messageType == 'popup-open') {
    disableRecordingIcon();
    const recording = await isRecording();
    if (recording) {
      const tab = await getCurrentTab();
      const url = tab.url;
      await setRecording(false);
      await chrome.tabs.sendMessage(tab.id!, { messageType: 'recording-ended' });
      const res = await uploadEvents(url!, events);
      events = [];
    }
  } else if (request.messageType == 'start-recording') {
    let tabId = (await getCurrentTab()).id;
    if (tabId) {
      await setRecording(true);
      await chrome.tabs.reload(tabId);
      enableRecordingIcon();
    }
  } else if (request.messageType == 'screenshot-event') {
    console.log('message');
    const { messageType, ...r } = request;
    const tab = await getCurrentTab();
    const url = tab?.url ?? '';
    const domFullEvent: BLEvent = {
      ...r,
      timestamp: Date.now(),
      url,
      sid,
      tab: tab.id,
      type: 'dom',
      name: 'dom-full'
    };
    await uploadEvents(url!, [domFullEvent]);
  } else {
    if (request.messageType == 'session-event') {
      const { messageType, ...r } = request;
      const tab = await getCurrentTab();
      const url = tab?.url ?? '';
      events.push({ ...r, timestamp: Date.now(), url, sid, tab: tab.id });

      if (r.name == 'referrer') {
        cookieDetailsEvent = await getCookiesFromDomain(url);
        events.push({ ...cookieDetailsEvent, timestamp: Date.now(), url, sid, tab: tab.id });
      }
    }
    sendResponse({});
  }
});

setRecording(false);

async function getCookiesFromDomain(url) {
  const domain = new URL(url).hostname;
  const cookieEvent = { name: 'cookie-details', type: 'cookie', details: {} };
  cookieEvent.details = await chrome.cookies.getAll({ domain: domain });
  return cookieEvent;
}
