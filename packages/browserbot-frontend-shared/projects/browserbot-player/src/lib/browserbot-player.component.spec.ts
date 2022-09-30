import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BrowserbotPlayerComponent } from './browserbot-player.component';

describe('BrowserbotPlayerComponent', () => {
  let component: BrowserbotPlayerComponent;
  let fixture: ComponentFixture<BrowserbotPlayerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ BrowserbotPlayerComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BrowserbotPlayerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
