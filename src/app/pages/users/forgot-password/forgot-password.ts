import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../services/auth';
import { RouterLink } from '@angular/router';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [FormsModule, RouterLink, NgIf],
  templateUrl: './forgot-password.html',
  styleUrls: ['./forgot-password.css']
})
export class ForgotPassword {

  email: string = '';

  isSubmitting: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';

  constructor(private authService: AuthService) {}

  onSubmit() {
    this.errorMessage = '';
    this.successMessage = '';
    this.isSubmitting = true;

    if (!this.email) {
      this.errorMessage = 'Kérlek, add meg az email címedet.';
      this.isSubmitting = false;
      return;
    }

    this.authService.forgotPassword(this.email).subscribe({
      next: (res) => {
        console.log('Forgot password response:', res);
        this.successMessage = 'Ha ez az email létezik a rendszerben, elküldtük a jelszó-visszaállító linket.';
        this.isSubmitting = false;
      },
      error: (err) => {
        console.error('Hiba az elfelejtett jelszó kérésnél 😥', err);
        // backend biztonsági okból amúgy is success-et küld, de azért ide is írunk valamit
        this.errorMessage = 'A kérés feldolgozása nem sikerült.';
        this.isSubmitting = false;
      }
    });
  }
}
