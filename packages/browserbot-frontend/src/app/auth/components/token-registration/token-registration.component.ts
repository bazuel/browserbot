import { Component, OnInit } from '@angular/core';
import { BBApiPermission, BBApiPermissionType } from '@browserbot/model';
import { TokenRegistrationService } from '../../services/token-registration.service';

@Component({
  selector: 'bb-token-registration',
  templateUrl: './token-registration.component.html',
  styleUrls: ['./token-registration.component.scss']
})
export class TokenRegistrationComponent implements OnInit {
  permissions = BBApiPermission;
  permissionSelected: BBApiPermissionType;
  token: string;

  constructor(private tokenRegistrationService: TokenRegistrationService) {}

  ngOnInit(): void {}

  async generate() {
    if (this.permissionSelected)
      this.token = (
        await this.tokenRegistrationService.generateToken(this.permissionSelected)
      ).apiToken;
    console.log(this.token);
  }
}
