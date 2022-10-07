import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { BLSessionEvent } from '@browserbot/model';
import { BrowserbotPlayerComponent } from 'browserbot-frontend-shared';

@Component({
  selector: 'bb-player',
  templateUrl: './player.component.html',
  styleUrls: ['./player.component.scss']
})
export class PlayerComponent implements OnInit {
  @Input()
  session: BLSessionEvent[] = [];
  @Input()
  interactive = true;

  @ViewChild('player', { static: false })
  screen!: BrowserbotPlayerComponent;
  playing = false;
  currentTimestamp!: number;

  constructor() {}

  ngOnInit(): void {}

  pause() {
    this.playing = false;
    this.screen.pause();
  }

  play() {
    this.playing = true;
    this.screen.play();
  }

  togglePlaying() {
    if (this.playing) this.pause();
    else this.play();
  }

  onPlayerUpdate(e: { timestamp: number; last?: boolean }) {
    this.updateCurrentTimestamp(e.timestamp);
    if (e.last) {
      this.pause();
    }
  }

  onPlayerResize(e: { scale: number }) {}

  updateCurrentTimestamp(timestamp: number) {
    if (this.session && this.session.length > 0) {
      const min = this.session[0].timestamp;
      const max = this.session[this.session.length - 1].timestamp;
      this.currentTimestamp = Math.max(min, Math.min(max, Math.round(timestamp)));
    }
  }
}
