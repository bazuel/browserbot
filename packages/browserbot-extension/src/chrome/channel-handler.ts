/**
 *  To communicate with page context we use
 *    - window.addEventListener( 'message', ... to receive messages
 *    - window.postMessage(...., '*'); to send messages
 *
 *  To communicate with extension context we use
 *    - chrome.runtime.onMessage.addEventListener(callBack) to receive messages
 *    - chrome.runtime.sendMessage to receive messages(message,...) to send messages
 *
 *  Note that messages from other sources may arrive, so assure we get messages from trusted sources
 *  when sending private data
 */

import { BLEvent } from '@browserbot/monitor';
import { enableExecutor } from './monitor-embedder';

function openCommunicationChannel() {
  //channel to extension
  chrome.runtime.onMessage.addListener(async function (request) {
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
