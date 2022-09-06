import { Pipe, PipeTransform } from '@angular/core';
import dayjs from 'dayjs';
import updateLocale from 'dayjs/plugin/updateLocale';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/it';

dayjs.locale('it');
dayjs.extend(updateLocale);
dayjs.extend(relativeTime);

const r = /^\d+$/;

export function getDate(value) {
  let v = value;
  if (r.test(value)) v = +value;
  if (typeof v === 'string' || v instanceof String) return new Date(Date.parse(v as string));
  else if (v instanceof Date) return v as Date;
  else if (!isNaN(v)) return new Date(v as number);
  else return new Date(value);
}

@Pipe({
  name: 'formatDate'
})
export class FormatDatePipe implements PipeTransform {
  transform(value, format?: string): string {
    if (value == null || value == undefined) return '';
    if (!format) {
      format = 'DD/MM/YYYY';
    }
    const date = getDate(value);
    return dayjs(date).format(format);
  }
}

@Pipe({
  name: 'formatTime'
})
export class FormatTimePipe implements PipeTransform {
  transform(value, format?: string): string {
    if (value == null || value == undefined) return '';
    if (!format) {
      format = 'HH:mm';
    }
    const date = getDate(value);
    return dayjs(date).format(format);
  }
}
