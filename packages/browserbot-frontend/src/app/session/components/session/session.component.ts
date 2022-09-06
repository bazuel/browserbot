import { Component, OnInit } from '@angular/core';
import { BBScreenShot, BBSession, BBSessionInfo } from '@browserbot/model';
import { UrlParamsService } from '../../../shared/services/url-params.service';
import { SessionService } from '../../services/session.service';
import { ShowFullScreenLoading } from '../../../shared/services/loading.service';

@Component({
  selector: 'bb-session',
  templateUrl: './session.component.html',
  styleUrls: ['./session.component.scss']
})
export class SessionComponent implements OnInit {
  session: BBSession = { path: '', url: '' };
  sessionInfo: BBSessionInfo;
  ready = false;
  detailsAction: {
    name?: string;
    timestamp?: string;
    screenShot?: string;
    domShot?: string;
  } = {};
  imgLoaded: true;

  constructor(private urlParamsService: UrlParamsService, private sessionService: SessionService) {}

  async ngOnInit() {
    const sessionid = this.urlParamsService.get('sessionid');
    if (sessionid) {
      this.session.bb_sessionid = sessionid;
      this.sessionInfo = await this.sessionService.getSessionInfoById(sessionid);
    }
    const sessionPath = this.urlParamsService.get('path');
    if (sessionPath && !sessionid) {
      this.session.path = sessionPath;
      this.sessionInfo = await this.sessionService.getSessionInfoByPath(sessionPath);
      console.log(this.sessionInfo);
    }
    this.ready = true;
  }

  @ShowFullScreenLoading()
  showDetails(action: BBScreenShot) {
    this.detailsAction = {
      // timestamp: action.filename.split("/"),
      name: action.filename.replace('.png', ''),
      screenShot: action.filename
    };
  }
}

/*http://localhost:4290/session/session-card?path=sessions%2Fstaging.agentesmith.com%2Fauth_@bb@_login%2F2022%2F09%2F05%2F1662372045609-292*/
