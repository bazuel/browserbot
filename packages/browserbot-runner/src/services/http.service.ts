import { BLEvent } from '@browserbot/model';
import { log } from './log.service';
import { JsonCompressor } from '@browserbot/common';

async function post<T>(path: string, body): Promise<T> {
  try {
    return await fetch(path, { method: 'POST', body: body }).then((res) => res.json());
  } catch (e) {
    log('error fetch: ', e);
  }
}

export async function uploadEvents(url: string, events: BLEvent[]) {
  const zipped = await new JsonCompressor().zip(events);
  const formData = new FormData();
  // params should be sent before files otherwise they can be null at the backend since the file was not fully loaded
  formData.append('url', url);
  formData.append('file', new Blob([zipped], { type: 'application/zip' }), `${Date.now()}.zip`);
  const result = await post<{ reference: string }>(
    'http://127.0.0.1:3005/api/session/upload',
    formData
  );
  return result.reference;
}

export async function linkSessions(masterPath: string, newPath: string) {
  const body = { masterPath, newPath };
  await post('http://127.0.0.1:3005/api/session/link', body);
}
