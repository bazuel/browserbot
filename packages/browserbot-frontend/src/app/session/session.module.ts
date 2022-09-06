import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SessionComponent } from './components/session/session.component';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../shared/shared.module';
import { SessionService } from './services/session.service';
import { BrowserbotSharedModule } from '../browserbot-shared/browserbot-shared.module';

const routes: Routes = [{ path: 'session-card', component: SessionComponent }];
@NgModule({
  declarations: [SessionComponent],
  imports: [CommonModule, RouterModule.forChild(routes), SharedModule, BrowserbotSharedModule],
  exports: [SessionComponent],
  providers: [SessionService]
})
export class SessionModule {}
