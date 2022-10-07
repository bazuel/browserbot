import { NgModule } from "@angular/core";
import { BrowserbotPlayerComponent } from "./player/browserbot-player.component";
import { IconComponent } from "./icon/icon.component";
import { PlayPauseAnimationComponent } from "./play-pause-animation/play-pause-animation.component";
import {CommonModule} from "@angular/common";

@NgModule({
  declarations: [
    BrowserbotPlayerComponent,
    IconComponent,
    PlayPauseAnimationComponent,
  ],
  imports: [CommonModule],
  exports: [
    BrowserbotPlayerComponent,
    IconComponent,
    PlayPauseAnimationComponent,
  ],
})
export class BBFrontendSharedModule {}
