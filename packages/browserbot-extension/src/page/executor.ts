import { DomMonitor } from '@browserbot/monitor';

const monitors = { dom: new DomMonitor() };

window.addEventListener('message', async (message) => {
  if (message.data.type == 'take-screenshot') {
    console.log('executor: take-screenshot');
    const domJson = monitors.dom.takeDomScreenshot();
    console.log(domJson);
    window.postMessage(
      { type: 'screenshot-event', data: { full: domJson, title: document.title } },
      '*'
    );
  }
});
