import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormatActionNamePipe } from './pipes/format-action-name.pipe';
import { FormatDatePipe, FormatTimePipe } from './pipes/time.pipe';
import { LogoComponent } from './components/logo/logo.component';

@NgModule({
  declarations: [FormatActionNamePipe, FormatTimePipe, FormatDatePipe, LogoComponent],
  exports: [FormatActionNamePipe, FormatDatePipe, FormatTimePipe, LogoComponent],
  imports: [CommonModule]
})
export class BrowserbotSharedModule {}
