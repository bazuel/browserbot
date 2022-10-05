import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import { RouterModule, Routes } from '@angular/router';
import { SessionModule } from './session/session.module';
import {BrowserbotPlayerModule} from "browserbot-player";

const routes: Routes = [
  {
    path: 'session',
    loadChildren: () =>
      import('./session/session.module').then((m) => m.SessionModule),
  },
];

@NgModule({
  declarations: [AppComponent],
  imports: [BrowserModule, RouterModule.forRoot(routes), SessionModule, BrowserbotPlayerModule, BrowserbotPlayerModule],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
