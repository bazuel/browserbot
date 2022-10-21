/**
Content script are loaded into another context than the page, so if we use the HttpMinitor here directly 
we are NOT monitoring the page context, but the page extension context. 

We need to add a script on the page (that will be 
injected into the page context) and then we need to pass messages back to the content script context
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

(async () => {
  const recording = await isRecording();
  if (recording) enablePageMonitoring();
})();

async function enableExecutor() {
  if (document.getElementById('bb-screenshot-taker-script')) return;
  return new Promise((r) => {
    const executorScript = document.createElement('script');
    executorScript.id = 'bb-screenshot-taker-script';
    executorScript.src = chrome.runtime.getURL('page/executor.js');
    (document.head || document.documentElement).appendChild(executorScript);
    executorScript.onload = r;
  });
}

function openCommunicationChannel() {
  //channel to extension
  chrome.runtime.onMessage.addListener(async function (request, sender, sendResponse) {
    if (request.messageType == 'recording-ended') {
      console.log('recording-ended');
      window.postMessage({ type: 'stop-recording' }, '*');
    } else if (request.messageType == 'take-screenshot') {
      await enableExecutor();
      console.log('embedder: take-screenshot');
      window.postMessage({ type: 'take-screenshot' }, '*');
    }
  });

  //channel to the page
  window.addEventListener(
    'message',
    function (event) {
      // We only accept messages from ourselves
      if (event.source != window) return;

      if (event.data.type && ['session-event', 'screenshot-event'].includes(event.data.type)) {
        const e: BLEvent = event.data.data;
        console.log('collecting event', e);
        chrome.runtime.sendMessage(
          { ...e, messageType: event.data.type, data: document.title },
          (response) => {
            if (response) console.log(response);
          }
        );
      }
    },
    false
  );
}

openCommunicationChannel();
