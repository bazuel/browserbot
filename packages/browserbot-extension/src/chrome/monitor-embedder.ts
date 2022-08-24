/**
Content script are loaded into another context than the page, so if we use the HttpMinitor here directly 
we are NOT monitoring the page context, but the page extension context. 

We need to add a script on the page (that will be 
iunjected into the page context) and then we need to pass messages back to the content script context 
of the extension, so to collect them.

Note that if you look at the console, messages from both contexts get printed there, 
and you may think that then it is the same context. But it's NOT ;-)
 
 To communicate we use 
 - window.addEventListener( 'message', ... to receive messages
 - window.postMessage(...., '*'); to send messages
 
 
 Note that messages from other sources may arrive, so assure we get messages from trusted sources 
 when sending private data

 */
import { BLEvent } from '@browserbot/monitor';
import { isRecording } from './recording.state';

function enablePageMonitoring() {
  const monitoringScript = document.createElement('script');
  monitoringScript.src = chrome.runtime.getURL('page/monitor.js');
  monitoringScript.onload = function (this: any) {
    this.remove();
  };
  (document.head || document.documentElement).appendChild(monitoringScript);
}

window.addEventListener(
  'message',
  function (event) {
    // We only accept messages from ourselves
    if (event.source != window) return;

    if (event.data.type && event.data.type == 'session-event') {
      const e: BLEvent = event.data.data;
      console.log('collecting event', e);
      chrome.runtime.sendMessage(
        { ...e, messageType: 'session-event', data: document.title },
        function (response) {
          if (response) console.log(response);
        }
      );
    }
  },
  false
);

chrome.runtime.onMessage.addListener(async function (request, sender, sendResponse) {
  console.log('recording-ended');
  if (request.messageType == 'recording-ended') {
    window.postMessage({ type: 'stop-recording' }, '*');
  }
});

(async () => {
  const recording = await isRecording();
  if (recording) enablePageMonitoring();
})();
