import { Routes } from '@angular/router';

import { Login } from './pages/users/login/login';
import { Home } from './pages/users/home/home';
import { Register } from './pages/users/register/register';
import { ForgotPassword } from './pages/users/forgot-password/forgot-password';
import { ResetPassword } from './pages/users/reset-password/reset-password';
import { VerifyEmail } from './pages/users/verify-email/verify-email';
import { Profile } from './pages/users/profile/profile';
import { Bill } from './pages/modules/bill/bill';

export const routes: Routes = [
  { path: '', component: Login },

  { path: 'home', component: Home },

  { path: 'register', component: Register },

  { path: 'forgot-password', component: ForgotPassword },

  { path: 'reset-password', component: ResetPassword },

  { path: 'verify-email', component: VerifyEmail } ,
  
  { path: 'profile', component: Profile },

  {path: 'bill', component: Bill}

];
