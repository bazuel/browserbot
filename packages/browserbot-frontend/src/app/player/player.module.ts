import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PlayerComponent } from './components/player/player.component';
import {BBFrontendSharedModule} from "browserbot-frontend-shared"


@NgModule({
  declarations: [
    PlayerComponent
  ],
  exports: [
    PlayerComponent
  ],
  imports: [
    CommonModule, BBFrontendSharedModule
  ]
})
export class PlayerModule { }
