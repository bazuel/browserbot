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
    const reference =
      '1667466329894_dom_dom-full_1666171426466_633167932_https%3A%2F%2Fstaging.agentesmith.com%2Fcompany%2Fcompany-dashboard';
    window.open(
      `${
        environment.pagepins_frontend
      }/editor?reference=${reference}&token=${this.tokenService.getApiToken()}`
    );
  }
}
