import { Injectable } from '@angular/core';
import { BBApiPermissionType } from '@browserbot/model/dist';
import { HttpService } from '../../shared/services/http.service';

@Injectable({
  providedIn: 'root'
})
export class TokenRegistrationService {
  constructor(private httpService: HttpService) {}

  async generateToken(permissionSelected: BBApiPermissionType) {
    return await this.httpService.gest<{ apiToken: string }>('/user/request-api-token-generation', {
      permission_type: permissionSelected
    });
  }

  async getToken() {
    return await this.httpService.get<{ apiToken: string }>('/user/get-api-token');
  }
}
