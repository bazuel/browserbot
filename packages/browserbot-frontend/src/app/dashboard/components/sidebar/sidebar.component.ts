import { Component, OnInit } from '@angular/core';
import { TokenService } from '../../../shared/services/token.service';

@Component({
  selector: 'bb-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent implements OnInit {
  constructor(private tokenService: TokenService) {}

  ngOnInit(): void {}

  logout() {
    this.tokenService.logout();
    window.location.href = '/';
  }
}
