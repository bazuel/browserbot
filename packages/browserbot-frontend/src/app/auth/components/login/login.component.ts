import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { UrlParamsService } from '../../../shared/services/url-params.service';
import { TokenService } from '../../../shared/services/token.service';
import { ShowFullScreenLoading } from '../../../shared/services/loading.service';
import { ShowNotification } from '../../../shared/components/notification/notification.component';

@Component({
  selector: 'bb-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  email = '';
  password = '';
  showForgotPasswordPopup = false;
  showResetPasswordPopup = false;
  tokenForPasswordReset = '';
  capsOn = false;

  constructor(
    private authService: AuthService,
    private urlParamsService: UrlParamsService,
    private tokenService: TokenService
  ) {}

  ngOnInit() {
    const token = this.urlParamsService.get('token');
    if (token) {
      this.showResetPasswordPopup = true;
      this.tokenForPasswordReset = token;
    }
  }

  @ShowFullScreenLoading()
  @ShowNotification(
    'Login effettuato',
    'Non è stato possibile effettuare il login. Controlla le tue credenziali'
  )
  async doLogin() {
    const loginToken = (await this.authService.login(this.email, this.password)).token;
    this.tokenService.set(loginToken);
    window.location.href = '/';
  }

  @ShowFullScreenLoading()
  @ShowNotification(
    'Verifica la tua email',
    "Non è stato possibile inviare l'email. Riprova più tardi"
  )
  async onForgotPassword() {
    const result = await this.authService.forgotPassword(this.email);
    console.log('result: ', result);
  }

  @ShowFullScreenLoading()
  @ShowNotification(
    'Password aggiornata',
    'Non è stato possibile aggiornare la password. Riprova più tardi'
  )
  async onResetPassword() {
    const result = await this.authService.resetPassword(this.tokenForPasswordReset, this.password);
    if (result.ok) {
      const email = this.tokenService.tokenData(this.tokenForPasswordReset).email;
      console.log(`logging in as ${email}`);
      this.email = email;
      setTimeout(() => {
        this.doLogin();
      }, 1500);
    }
  }
}
