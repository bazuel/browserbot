chrome.runtime.sendMessage({ messageType: 'popup-open' });

async function startRecording() {
  chrome.runtime.sendMessage({ messageType: 'start-recording' });
  window.close();
}
document.addEventListener(
  'DOMContentLoaded',
  function () {
    document.querySelector('#hmr')!.addEventListener('click', () => chrome.runtime.reload(), false);
    document.querySelector('#start-recording')!.addEventListener('click', startRecording, false);
  },
  false
);

chrome.action.setIcon({ path: '/assets/icon-48.png' });
