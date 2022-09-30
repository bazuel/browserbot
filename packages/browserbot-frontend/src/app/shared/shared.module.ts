import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UrlParamsService } from './services/url-params.service';
import { HttpService } from './services/http.service';
import { HttpClientModule } from '@angular/common/http';
import { BrowserbotSharedModule } from '../browserbot-shared/browserbot-shared.module';
import { IconComponent } from './components/icon/icon.component';
import { PopupComponent } from './components/popup/popup.component';

@NgModule({
  declarations: [IconComponent, PopupComponent],
  imports: [CommonModule, HttpClientModule, BrowserbotSharedModule],
  providers: [UrlParamsService, HttpService],
  exports: [IconComponent, PopupComponent]
})
export class SharedModule {}
