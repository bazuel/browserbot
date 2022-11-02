import { NgModule } from "@angular/core";
import { BrowserbotPlayerComponent } from "./player/browserbot-player.component";
import { IconComponent } from "./icon/icon.component";
import { PlayPauseAnimationComponent } from "./play-pause-animation/play-pause-animation.component";
import { CommonModule } from "@angular/common";
import { BrowserbotCameraComponent } from "./player/browserbot-camera.component";

@NgModule({
  declarations: [
    BrowserbotPlayerComponent,
    IconComponent,
    PlayPauseAnimationComponent,
    BrowserbotCameraComponent,
  ],
  imports: [CommonModule],
  exports: [
    BrowserbotPlayerComponent,
    IconComponent,
    PlayPauseAnimationComponent,
    BrowserbotCameraComponent,
  ],
})
export class BBFrontendSharedModule {}
