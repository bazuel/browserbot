import { Buffer } from 'buffer';
import { StorageService } from '../../src/storage/storage.service';
import { ConfigService } from '../../src/shared/config.service';

require('dotenv').config();

jest.setTimeout(300 * 1000);
test('test file upload', async () => {
  const content = 'ciao' + Date.now();
  const fileContent = Buffer.from(content, 'utf8');
  const ss = new StorageService(new ConfigService());
  const listResult = await ss.list();
  console.log('listResult: ', listResult);
  const files = listResult.map((f) => f.Key);
  console.log('files: ', files);
  const fileName = 'test/' + Date.now() + 'ciao.txt';
  const result = await ss.upload(fileContent, fileName);
  console.log('result: ', result);
  const newListResult = await ss.list();
  const newFiles = newListResult.map((f) => f.Key);
  console.log('newFiles: ', newFiles);
  expect(files.length).toBeLessThan(newFiles.length);

  const savedContent = await ss.read(fileName);
  expect(savedContent.toString('utf-8')).toBe(content);
  const delResult = await ss.delete(fileName);
  console.log('delResult: ', delResult);
  const newListResultAfterDelete = await ss.list();
  const newFilesAfterDelete = newListResultAfterDelete.map((f) => f.Key);
  expect(files.length).toBe(newFilesAfterDelete.length);
});

test('stream upload', async () => {
  const content = 'prova di stream';
  const Readable = require('stream').Readable;
  const s = new Readable();
  s.push(content);
  s.push(null);
  const ss = new StorageService(new ConfigService());
  const fileName = 'test/' + Date.now() + 'testuploadstream.txt';
  await ss.upload(s, fileName);

  const savedContent = await ss.read(fileName);
  expect(savedContent.toString('utf-8')).toBe(content);
  const delResult = await ss.delete(fileName);
  console.log('delResult: ', delResult);
});
