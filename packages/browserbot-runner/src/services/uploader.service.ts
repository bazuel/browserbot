import { BLEvent } from '@browserbot/model';
import { log } from './log.service';
import { JsonCompressor } from '@browserbot/common';

export async function uploadEvents(url: string, events: BLEvent[]) {
  const zipped = await new JsonCompressor().zip(events);
  const formData = new FormData();
  // params should be sent before files otherwise they can be null at the backend since the file was not fully loaded
  formData.append('url', url);
  formData.append('file', new Blob([zipped], { type: 'application/zip' }), Date.now() + '.zip');
  await fetch('http://127.0.0.1:3005/api/session/upload', {
    method: 'POST',
    body: formData
  })
    .then((resp) => resp.json())
    .then((json) => console.log(json))
    .catch((e) => log('error fetch: ', e));
}
