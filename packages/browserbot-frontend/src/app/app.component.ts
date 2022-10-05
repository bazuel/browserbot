import {Component, OnInit, ViewChild} from '@angular/core';
import { LoadingService } from './shared/services/loading.service';
import { BLSessionEvent, unzipJson } from 'browserbot-common';
import {BrowserbotPlayerComponent} from "browserbot-player";

@Component({
  selector: 'bb-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  session!: BLSessionEvent[];

  @ViewChild(BrowserbotPlayerComponent) player!:BrowserbotPlayerComponent

  constructor(public loadingService: LoadingService) {}

  async ngOnInit() {
    const raw = await fetch(
      `http://localhost:3005/api/session/download?path=${encodeURIComponent(
        'nestjs.com/2022-10-05/1664988120365_page_referrer_1664558619247_630439501_https%3A%2F%2Fnestjs.com%2F.zip'
      )}`
    ).then((response) => response.arrayBuffer());
    const events = await unzipJson(raw as Buffer);
    console.log(events);
    this.session = events as BLSessionEvent[];
    setTimeout(()=>{
      this.player.play()
    },5000)
  }
}
