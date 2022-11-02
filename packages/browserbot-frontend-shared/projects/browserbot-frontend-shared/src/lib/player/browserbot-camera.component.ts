import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  ViewChild,
} from "@angular/core";
import { BLDomEvent } from "browserbot-common";
import { PlayerComponent } from "./player.component";

@Component({
  selector: "bb-browserbot-camera",
  template: ` <div #camera class="camera"></div> `,
  styles: [
    `
      :host {
        display: block;
      }

      .camera {
        display: flex;
        align-items: center;
        max-width: 100%;
        max-height: 100%;
        justify-content: center;
      }
    `,
  ],
})
export class BrowserbotCameraComponent implements AfterViewInit {
  @ViewChild("camera", { static: true })
  camera!: ElementRef<HTMLDivElement>;

  @Input()
  domEvent!: BLDomEvent;

  @Output()
  playerUpdate = new EventEmitter<{ timestamp: number; last?: boolean }>();

  @Output()
  playerResize = new EventEmitter<{ scale: number }>();

  @Output()
  playerClick = new EventEmitter<void>();

  private player!: PlayerComponent;

  constructor() {}

  async ngAfterViewInit() {
    if (this.domEvent) this.updatePlayerSession();
    document.addEventListener("bl-devtool-resize", () => {
      this.player.updatePlayerZoom();
    });
  }

  private updatePlayerSession() {
    if (!this.player) {
      this.player = new PlayerComponent(this.camera.nativeElement, {
        deserializerProxyBasePath: "http://localhost:2550", //this.config.proxyBasePath,
        onTimestampChange: (ts, last?: boolean) => {
          this.playerUpdate.emit({ timestamp: Math.round(ts), last });
        },
        onIframeClick: () => {
          this.playerClick.emit();
        },
        onResize: (scale) => {
          this.playerResize.emit({ scale });
        },
      });
    }
    //let domFullTimestamp = this.session.find(h => (h as BLDomEvent).full)!.timestamp
    this.player.setEvents([this.domEvent]);
  }
}
