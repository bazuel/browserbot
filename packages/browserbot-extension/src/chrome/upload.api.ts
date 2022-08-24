import { JsonCompressor } from '../shared/serialization/json-compressor';
import { BLEvent } from '@browserbot/monitor';

export async function uploadEvents(url: string, events: BLEvent[]) {
  const zip = await new JsonCompressor().zip(events);
  const formData = new FormData();
  // params should be sent before files otherwise they can be null at the backend since the file was not fully loaded
  formData.append('url', url);
  formData.append('file', new Blob([zip], { type: 'application/zip' }), Date.now() + '.zip');
  fetch('http://localhost:3005/api/session/upload', {
    method: 'POST',
    body: formData
  })
    .then(function (resp) {
      return resp.json();
    })
    .then(function (json) {
      console.log(json);
    });
}
