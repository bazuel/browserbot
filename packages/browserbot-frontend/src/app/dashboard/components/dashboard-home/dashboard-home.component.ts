import { Component, OnInit } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { TokenRegistrationService } from '../../../auth/services/token-registration.service';

@Component({
  selector: 'bb-dashboard-home',
  templateUrl: './dashboard-home.component.html',
  styleUrls: ['./dashboard-home.component.scss']
})
export class DashboardHomeComponent implements OnInit {
  constructor(private tokenRegistrationService: TokenRegistrationService) {}

  ngOnInit(): void {}

  async redirectToPagePins() {
    const apiToken = await this.tokenRegistrationService
      .getToken()
      .then((result) => result.apiToken);
    window.open(`${environment.pagepins_frontend}/editor?token=${apiToken}`);
  }
}
