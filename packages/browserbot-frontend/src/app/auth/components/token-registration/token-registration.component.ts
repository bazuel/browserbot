import { Component, OnInit } from '@angular/core';
import { BBApiPermission, BBApiPermissionType } from '@browserbot/model';
import { TokenRegistrationService } from '../../services/token-registration.service';
import { TokenService } from '../../../shared/services/token.service';

@Component({
  selector: 'bb-token-registration',
  templateUrl: './token-registration.component.html',
  styleUrls: ['./token-registration.component.scss']
})
export class TokenRegistrationComponent implements OnInit {
  permissions = BBApiPermission;
  permissionSelected: BBApiPermissionType;
  token: string;

  constructor(
    private tokenRegistrationService: TokenRegistrationService,
    private tokenService: TokenService
  ) {}

  ngOnInit(): void {}

  async generate() {
    if (this.permissionSelected)
      this.tokenRegistrationService.generateToken(this.permissionSelected).then((token) => {
        this.token = token.apiToken;
        this.tokenService.setApiToken(token.apiToken);
      });
  }
}
