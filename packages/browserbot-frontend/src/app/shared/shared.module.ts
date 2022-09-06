import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UrlParamsService } from './services/url-params.service';
import { HttpService } from './services/http.service';
import { HttpClientModule } from '@angular/common/http';
import { BrowserbotSharedModule } from '../browserbot-shared/browserbot-shared.module';

@NgModule({
  declarations: [],
  imports: [CommonModule, HttpClientModule, BrowserbotSharedModule],
  providers: [UrlParamsService, HttpService]
})
export class SharedModule {}
