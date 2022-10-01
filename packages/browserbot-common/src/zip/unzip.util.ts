import { strFromU8, unzip } from "fflate";
import { isReadableStream, streamToBuffer } from "../stream/stream.util";
import * as Buffer from "buffer";

export async function unzipJson<T>(
  zipFile: Buffer | ReadableStream
): Promise<T> {
  return await new Promise(async (s, e) => {
    let zip: Buffer | ReadableStream = zipFile as Buffer;
    if (isReadableStream(zipFile))
      zip = await streamToBuffer(zipFile as ReadableStream);
    unzip(new Uint8Array(zip), async (err, data) => {
      if (err) e(err);
      const filename = Object.keys(data)[0];
      const raw = strFromU8(data[filename]);
      s(JSON.parse(raw) as T);
    });
  });
}
