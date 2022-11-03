import { Component, OnInit } from '@angular/core';
import { BBScreenShot, BBSession, BLSessionEvent } from '@browserbot/model';
import { UrlParamsService } from '../../../shared/services/url-params.service';
import { SessionService } from '../../services/session.service';
import { ShowFullScreenLoading } from '../../../shared/services/loading.service';

@Component({
  selector: 'bb-session',
  templateUrl: './session.component.html',
  styleUrls: ['./session.component.scss']
})
export class SessionComponent implements OnInit {
  session: BBSession = { reference: '', url: '' };
  sessionEvents: BLSessionEvent[] = [];
  ready = false;
  detailsAction: {
    name?: string;
    timestamp?: string;
    screenShot?: string;
    domShot?: string;
  } = {};
  imgLoaded = false;
  showVideo = false;
  sessionMocked = false;

  constructor(private urlParamsService: UrlParamsService, private sessionService: SessionService) {}

  @ShowFullScreenLoading()
  async ngOnInit() {
    const sessionReference = this.urlParamsService.get('path');
    if (sessionReference) {
      this.session.reference = sessionReference;
      this.sessionEvents = []; //await this.sessionService.downloadSession(sessionReference);
    }
    this.ready = true;
  }

  @ShowFullScreenLoading()
  async showDetails(action: BBScreenShot) {
    this.detailsAction = {
      // timestamp: action.filename.split("/"),
      name: action.filename.replace('.png', ''),
      screenShot: action.filename
    };

    await new Promise((r) => {
      const image = new Image();
      image.onload = r;
      image.src = 'http://localhost:3005/api/session/screenshot?path=' + this.detailsAction.name;
    });
    this.imgLoaded = true;
  }

  async runSession() {}
}
