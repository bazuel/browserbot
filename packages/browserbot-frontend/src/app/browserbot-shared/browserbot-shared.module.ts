import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormatActionNamePipe } from './pipes/format-action-name.pipe';
import { FormatDatePipe, FormatTimePipe } from './pipes/time.pipe';

@NgModule({
  declarations: [FormatActionNamePipe, FormatTimePipe, FormatDatePipe],
  exports: [FormatActionNamePipe, FormatDatePipe, FormatTimePipe],
  imports: [CommonModule]
})
export class BrowserbotSharedModule {}
