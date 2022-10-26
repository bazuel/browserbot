import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoginComponent } from './components/login/login.component';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SharedModule } from '../shared/shared.module';
import { BrowserbotSharedModule } from '../browserbot-shared/browserbot-shared.module';
import { RegistrationComponent } from './components/registration/registration.component';
import { TokenRegistrationComponent } from './components/token-registration/token-registration.component';
import { IsLogged } from '../shared/services/is-logged.guard';

const authRoutes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'registration', component: RegistrationComponent },
  { path: 'token-registration', component: TokenRegistrationComponent, canActivate: [IsLogged] }
];

@NgModule({
  declarations: [LoginComponent, RegistrationComponent, TokenRegistrationComponent],
  imports: [
    CommonModule,
    RouterModule.forChild(authRoutes),
    FormsModule,
    SharedModule,
    BrowserbotSharedModule
  ]
})
export class AuthModule {}
