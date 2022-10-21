/**
 *  Content script are loaded into another context than the page, so if we use the HttpMinitor here directly
 *  we are NOT monitoring the page context, but the page extension context.
 *
 *  We need to add a script on the page (that will be
 *  injected into the page context) and then we need to pass messages back to the content script context
 *  of the extension, so to collect them.
 *
 *  Note that if you look at the console, messages from both contexts get printed there,
 *  and you may think that then it is the same context. But it's NOT ;-)
 */

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

export async function enableExecutor() {
  if (document.getElementById('bb-screenshot-taker-script')) return;
  return new Promise((r) => {
    const executorScript = document.createElement('script');
    executorScript.id = 'bb-screenshot-taker-script';
    executorScript.src = chrome.runtime.getURL('page/executor.js');
    (document.head || document.documentElement).appendChild(executorScript);
    executorScript.onload = r;
  });
}
