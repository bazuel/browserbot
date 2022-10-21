import { getCurrentTab } from './chrome/current-tab.util';

chrome.runtime.sendMessage({ messageType: 'popup-open' });

async function takeScreenshot() {
  let tabId = (await getCurrentTab()).id;
  chrome.tabs.sendMessage(tabId!, { messageType: 'take-screenshot' });
  window.close();
}

async function takeVideo() {
  chrome.runtime.sendMessage({ messageType: 'start-recording' });
  window.close();
}

document.addEventListener(
  'DOMContentLoaded',
  function () {
    document.querySelector('#hmr')!.addEventListener('click', () => chrome.runtime.reload(), false);
    document.querySelector('#video')!.addEventListener('click', takeVideo, false);
    document.querySelector('#shot')!.addEventListener('click', takeScreenshot, false);
  },
  false
);

chrome.action.setIcon({ path: '/assets/icon-48.png' });
