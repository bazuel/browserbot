import {
  BLEvent,
  BLEventName,
  BLEventType,
  BLSessionEvent,
  BLSessionReference,
} from "@browserbot/model";
import {domainFromUrl} from "./domain-from-url.util";

export function eventPath(event: BLSessionEvent) {
  return `${domainFromUrl(event.url)}/${eventId(event)}`
}
export function eventId(event: BLSessionEvent) {
  return `${event.timestamp}_${event.type}_${event.name}_${event.sid}_${
    event.tab
  }_${encodeURIComponent(event.url)}`;
}

export function eventInfoFromId(eventId: string): BLSessionReference & BLEvent {
  const parts = eventId.split("_");
  const timestamp = +parts[0];
  const type = parts[1] as BLEventType;
  const name = parts[2] as BLEventName;
  const sid = +parts[3];
  const tab = +parts[4];
  const url = decodeURIComponent(parts.slice(5).join("_"));
  return { name, type, sid, tab, timestamp, url };
}
