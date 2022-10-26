import {
  ActivatedRouteSnapshot,
  CanActivate,
  Router,
  RouterStateSnapshot,
} from '@angular/router';
import { Injectable } from '@angular/core';
import { TokenService } from './token.service';

@Injectable()
export class IsLogged implements CanActivate {
  lastUrl = '';

  constructor(
    private tokenService: TokenService,
    private router: Router
  ) {}

  async canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Promise<boolean> {
    try {
      const isTokenExpired = this.tokenService.isExpired();
      if (isTokenExpired) {
        sessionStorage.setItem(this.lastUrl, window.location.href);
        await this.router.navigateByUrl('auth/login');
      }
      return !isTokenExpired;
    } catch (e) {
      console.error(e);
      return false;
    }
  }
}
