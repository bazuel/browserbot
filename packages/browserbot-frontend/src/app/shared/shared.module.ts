import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UrlParamsService } from './services/url-params.service';
import { HttpService } from './services/http.service';
import { HttpClientModule } from '@angular/common/http';
import { BrowserbotSharedModule } from '../browserbot-shared/browserbot-shared.module';
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
import { IsLogged } from './services/is-logged.guard';

@NgModule({
  declarations: [
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
    IsLogged,
    { provide: NotificationService, useValue: new NotificationService() }
  ],
  exports: [
    PopupComponent,
    NotificationComponent,
    CapsLockDirective,
    ClickOutsideDirective,
    HighlightPipe,
    AutocompleteComponent
  ]
})
export class SharedModule {}
