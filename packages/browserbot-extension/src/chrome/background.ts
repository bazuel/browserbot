import { disableRecordingIcon, enableRecordingIcon } from './ui/recording-icon';
import { BLEvent } from '@browserbot/monitor';
import { getCurrentTab } from './current-tab.util';
import { isRecording, setRecording } from './recording.state';
import { uploadEvents } from './upload.api';

const session = { tab: 0 };
let cookieDetailsEvent: any = {};
let events: BLEvent[] = [];

chrome.runtime.onMessage.addListener(async function (request, sender, sendResponse) {
  const tab = await getCurrentTab();
  const url = tab.url;
  if (request.messageType == 'popup-open') {
    disableRecordingIcon();
    const recording = await isRecording();
    if (recording) {
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
      session.tab = tabId ?? Date.now();
      enableRecordingIcon();
    }
  } else {
    if (request.messageType == 'session-event') {
      const { messageType, ...r } = request;
      events.push({ ...r, timestamp: Date.now(), url, ...session });

      if (r.name == 'referrer') {
        cookieDetailsEvent = await getCookiesFromDomain(url);
        events.push({ ...cookieDetailsEvent, timestamp: Date.now(), url, ...session });
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
