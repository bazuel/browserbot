import { Injectable } from '@angular/core';
import * as dayjs from 'dayjs';
import { getDate } from '../../browserbot-shared/pipes/time.pipe';

@Injectable({
  providedIn: 'root'
})
export class TimeService {
  constructor() {}

  addMonths(months: number, date_start: Date) {
    return dayjs(date_start).add(months, 'months').toDate();
  }

  diffMonths(date_end: Date, date_start: Date) {
    return dayjs(date_end).diff(date_start, 'months');
  }

  isBefore(d1: Date, d2: Date) {
    return dayjs(getDate(d1)).isBefore(getDate(d2));
  }

  isAfter(d1: Date, d2: Date) {
    return dayjs(getDate(d1)).isAfter(getDate(d2));
  }
}
