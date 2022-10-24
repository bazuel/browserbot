import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import { RouterModule, Routes } from '@angular/router';
import { SessionModule } from './session/session.module';
import { PlayerModule } from './player/player.module';
import { BBFrontendSharedModule } from 'browserbot-frontend-shared';
import { AuthModule } from './auth/auth.module';
import { SharedModule } from './shared/shared.module';

const routes: Routes = [
  {
    path: 'session',
    loadChildren: () => import('./session/session.module').then((m) => m.SessionModule)
  },
  {
    path: 'auth',
    loadChildren: () => import('./auth/auth.module').then((m) => m.AuthModule)
  }
];

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    RouterModule.forRoot(routes),
    SessionModule,
    PlayerModule,
    BBFrontendSharedModule,
    AuthModule,
    SharedModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {}
