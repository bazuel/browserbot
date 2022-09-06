import { Injectable } from '@angular/core';
import { HttpService } from '../../shared/services/http.service';
import { BBSessionInfo } from '@browserbot/model';

@Injectable({
  providedIn: 'root'
})
export class SessionService {
  constructor(private httpService: HttpService) {}

  async getSessionInfoByPath(path: string) {
    return this.httpService.gest<BBSessionInfo>('/session/info-by-path', { path });
  }

  async getSessionInfoById(id: string) {
    return this.httpService.gest<BBSessionInfo>('/session/info-by-id', { id });
  }
}
