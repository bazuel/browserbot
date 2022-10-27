import { BLEvent } from '@browserbot/model';
import { zlibSync } from 'fflate';

export async function uploadEvents(url: string, events: BLEvent[]) {
  const zipped = zlibSync(new Uint8Array(Buffer.from(JSON.stringify(events))));
  const formData = new FormData();
  // params should be sent before files otherwise they can be null at the backend since the file was not fully loaded
  formData.append('url', url);
  formData.append('file', new Blob([zipped], { type: 'application/zip' }), Date.now() + '.zip');
  fetch('http://localhost:3005/api/session/upload', {
    method: 'POST',
    body: formData
  })
    .then((resp) => resp.json())
    .then((json) => console.log(json));
}
