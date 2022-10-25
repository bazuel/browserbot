import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UrlParamsService } from './services/url-params.service';
import { HttpService } from './services/http.service';
import { HttpClientModule } from '@angular/common/http';
import { BrowserbotSharedModule } from '../browserbot-shared/browserbot-shared.module';
import { IconComponent } from './components/icon/icon.component';
import { PopupComponent } from './components/popup/popup.component';
import {
  NotificationComponent,
  NotificationService
} from './components/notification/notification.component';
import { TokenService } from './services/token.service';
import { CapsLockDirective } from './directives/caps-lock.directive';
import { AutocompleteComponent } from './components/autocomplete/autocomplete.component';
import { FormsModule } from '@angular/forms';
import { ClickOutsideDirective } from './directives/click-outside.directive';
import { HighlightPipe } from './pipes/highlight.pipe';

@NgModule({
  declarations: [
    IconComponent,
    PopupComponent,
    NotificationComponent,
    CapsLockDirective,
    CapsLockDirective,
    AutocompleteComponent,
    ClickOutsideDirective,
    HighlightPipe
  ],
  imports: [CommonModule, HttpClientModule, BrowserbotSharedModule, FormsModule],
  providers: [
    UrlParamsService,
    HttpService,
    TokenService,
    { provide: NotificationService, useValue: new NotificationService() }
  ],
  exports: [
    IconComponent,
    PopupComponent,
    NotificationComponent,
    CapsLockDirective,
    ClickOutsideDirective,
    HighlightPipe,
    AutocompleteComponent
  ]
})
export class SharedModule {}
