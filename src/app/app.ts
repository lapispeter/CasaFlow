import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Bill } from './pages/modules/bill/bill';
import { Reminder } from './pages/modules/reminder/reminder';
import { ShoppingList } from './pages/modules/shopping-list/shopping-list';
import { MeterReading } from './pages/modules/meter-reading/meter-reading';
import { ForgotPassword } from './pages/users/forgot-password/forgot-password';
import { Home } from './pages/users/home/home';
import { Login } from './pages/users/login/login';
import { Profile } from './pages/users/profile/profile';
import { Register } from './pages/users/register/register';
import { ResetPassword } from './pages/users/reset-password/reset-password';
import { VerifyEmail } from './pages/users/verify-email/verify-email';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet,Bill,Reminder,ShoppingList,MeterReading, ForgotPassword,Home,Login,Profile,Register,ResetPassword, VerifyEmail],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('CasaFlow');
}
