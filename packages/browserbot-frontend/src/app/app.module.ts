import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppComponent } from './app.component';
import { RouterModule, Routes } from '@angular/router';
import { PlayerModule } from './player/player.module';
import { BBFrontendSharedModule } from 'browserbot-frontend-shared';
import { SharedModule } from './shared/shared.module';
import { SidebarComponent } from './dashboard/components/sidebar/sidebar.component';
import { BrowserbotSharedModule } from './browserbot-shared/browserbot-shared.module';
import { IsLogged } from './shared/services/is-logged.guard';
import { DashboardHomeComponent } from './dashboard/components/dashboard-home/dashboard-home.component';

const routes: Routes = [
  {
    path: 'session',
    loadChildren: () => import('./session/session.module').then((m) => m.SessionModule),
    canActivate: [IsLogged]
  },
  {
    path: 'auth',
    loadChildren: () => import('./auth/auth.module').then((m) => m.AuthModule)
  },
  {
    path: 'dashboard',
    loadChildren: () => import('./dashboard/dashboard.module').then((m) => m.DashboardModule),
    canActivate: [IsLogged]
  },
  {
    path: '',
    redirectTo: 'dashboard/home',
    pathMatch: 'prefix'
  }
];

@NgModule({
  declarations: [AppComponent, SidebarComponent, DashboardHomeComponent],
  imports: [
    BrowserModule,
    RouterModule.forRoot(routes),
    PlayerModule,
    BBFrontendSharedModule,
    SharedModule,
    BrowserbotSharedModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {}
