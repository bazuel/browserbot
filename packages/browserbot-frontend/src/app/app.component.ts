import { Component, OnInit } from '@angular/core';
import { LoadingService } from './shared/services/loading.service';
import { BLSessionEvent } from '@browserbot/model';
import { UrlParamsService } from './shared/services/url-params.service';
import { SessionService } from './session/services/session.service';
import { TokenService } from './shared/services/token.service';

@Component({
  selector: 'bb-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  sessionEvents: BLSessionEvent[];

  constructor(
    public loadingService: LoadingService,
    private urlParamsService: UrlParamsService,
    private sessionService: SessionService,
    public tokenService: TokenService
  ) {}

  async ngOnInit() {
    const sessionPath = this.urlParamsService.get('path');
    if (sessionPath) this.sessionEvents = await this.sessionService.downloadSession(sessionPath);
  }
}
