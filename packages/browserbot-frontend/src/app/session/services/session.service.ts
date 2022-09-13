import { Injectable } from '@angular/core';
import { HttpService } from '../../shared/services/http.service';
import { BBSessionInfo } from '@browserbot/model';

@Injectable({
  providedIn: 'root'
})
export class SessionService {
  constructor(private httpService: HttpService) {}

  async getSessionInfoByPath(path: string) {
    return await this.httpService.gest<BBSessionInfo>('/session/info-by-path', { path });
  }

  async getSessionInfoById(id: string) {
    return await this.httpService.gest<BBSessionInfo>('/session/info-by-id', { id });
  }

  async runSession(path: string) {
    this.httpService.setRootUrl('runner');
    return await this.httpService
      .gest<{ ok: string }>('/events', { path: path + '.zip', backend: 'full' })
      .then(() => this.httpService.setRootUrl('backend'));
  }
}
