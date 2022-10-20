import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SessionComponent } from './components/session/session.component';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../shared/shared.module';
import { SessionService } from './services/session.service';
import { BrowserbotSharedModule } from '../browserbot-shared/browserbot-shared.module';
import {PlayerModule} from "../player/player.module";
import { EventListComponent } from './components/event-list/event-list.component';

const sessionRoutes: Routes = [{ path: 'card', component: SessionComponent }];
@NgModule({
  declarations: [SessionComponent, EventListComponent],
    imports: [CommonModule, RouterModule.forChild(sessionRoutes), SharedModule, BrowserbotSharedModule, PlayerModule],
  exports: [SessionComponent],
  providers: [SessionService]
})
export class SessionModule {}
