import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import { RouterModule, Routes } from '@angular/router';
import { SessionModule } from './session/session.module';
import {PlayerModule} from "./player/player.module";
import {BBFrontendSharedModule} from "browserbot-frontend-shared";

const routes: Routes = [
  {
    path: 'session',
    loadChildren: () =>
      import('./session/session.module').then((m) => m.SessionModule),
  },
];

@NgModule({
  declarations: [AppComponent],
  imports: [BrowserModule, RouterModule.forRoot(routes),
    SessionModule, PlayerModule, BBFrontendSharedModule],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
