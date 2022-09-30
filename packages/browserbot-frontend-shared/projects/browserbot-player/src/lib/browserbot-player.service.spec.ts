import { TestBed } from '@angular/core/testing';

import { BrowserbotPlayerService } from './browserbot-player.service';

describe('BrowserbotPlayerService', () => {
  let service: BrowserbotPlayerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BrowserbotPlayerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
