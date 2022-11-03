import { Injectable } from '@angular/core';
import { HttpService } from '../../shared/services/http.service';
import { BLSessionEvent } from '@browserbot/model';
import { environment } from '../../../environments/environment';
import { unzipJson } from 'browserbot-common';

@Injectable({
  providedIn: 'root'
})
export class SessionService {
  constructor(private httpService: HttpService) {}

  async downloadSession(path: string) {
    const raw = await this.httpService.getAsBuffer(
      `/session/download?path=${encodeURIComponent(path)}.zip`
    );
    const events = await unzipJson(raw as Buffer);
    return events as BLSessionEvent[];
  }

  async runSession(path: string, mocked: boolean) {
    return await this.httpService.gest<{ ok: string }>(environment.api_runner + '/events', {
      path: path + '.zip',
      backend: mocked ? 'mock' : 'full'
    });
  }
}
