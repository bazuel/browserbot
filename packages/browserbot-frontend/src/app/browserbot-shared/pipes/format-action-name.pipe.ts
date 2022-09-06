import { Pipe, PipeTransform } from '@angular/core';
import { getDate } from './time.pipe';

@Pipe({
  name: 'formatAction'
})
export class FormatActionNamePipe implements PipeTransform {
  transform(path: any, arg: string): any {
    const elements = path.split('/');
    const len = elements.length;
    if (arg == 'timestamp') return getDate(elements[len - 1].split('.')[0]);
    if (arg == 'name') return elements[len - 2];
  }
}
