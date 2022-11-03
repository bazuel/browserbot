import { Component, OnInit } from '@angular/core';
import { TokenService } from '../../../shared/services/token.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'bb-dashboard-home',
  templateUrl: './dashboard-home.component.html',
  styleUrls: ['./dashboard-home.component.scss']
})
export class DashboardHomeComponent implements OnInit {
  constructor(private tokenService: TokenService) {}

  ngOnInit(): void {}

  redirectToPagePins() {
    window.open(`${environment.pagepins_frontend}/editor?token=${this.tokenService.getApiToken()}`);
  }
}
