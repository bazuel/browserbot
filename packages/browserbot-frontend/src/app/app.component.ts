import { Component, OnInit } from '@angular/core';
import { LoadingService } from './shared/services/loading.service';
import {unzipJson} from "browserbot-common";

@Component({
  selector: 'bb-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'browserbot-frontend';

  constructor(public loadingService: LoadingService) {}

  async ngOnInit() {
    const raw = await fetch(`http://localhost:3005/api/session/download?path=nestjs.com/2022-10-05/${encodeURIComponent("1664977468503_page_referrer_1664558619247_630439492_https%3A%2F%2Fnestjs.com%2F.zip")}`).then( response => response.arrayBuffer())
    const events = await unzipJson(raw as Buffer)
    console.log(events)
  }
}
