import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { BBUser } from '@browserbot/model';
import { ShowFullScreenLoading } from '../../../shared/services/loading.service';
import { ShowNotification } from '../../../shared/components/notification/notification.component';

@Component({
  selector: 'bb-signin',
  templateUrl: './registration.component.html',
  styleUrls: ['./registration.component.scss']
})
export class RegistrationComponent implements OnInit {
  user!: BBUser;
  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.user = { email: '', name: '', roles: [], state: undefined, surname: '', teams: [] };
  }

  @ShowFullScreenLoading()
  @ShowNotification('Verify your email', 'Send email was not possible. Try later')
  async doSignIn() {
    const result = await this.authService.signIn(this.user);
    console.log('result: ', result);
  }
}
