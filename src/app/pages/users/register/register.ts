import { Component } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { AuthService, RegisterRequest } from '../../../services/auth';
import { Router, RouterLink } from '@angular/router';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, RouterLink, NgIf],
  templateUrl: './register.html',
  styleUrls: ['./register.css']
})
export class Register {

  name: string = '';
  email: string = '';
  password: string = '';
  passwordConfirmation: string = '';

  errorMessage: string = '';
  successMessage: string = '';
  isSubmitting: boolean = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  /**
   * ✅ Backendből jövő angol üzeneteket magyarít (akkor is, ha több hiba van egy stringben)
   */
  private toHuMessage(raw: string): string {
    const msg = (raw || '').toLowerCase();

    const usernameTaken =
      msg.includes('username') && (msg.includes('already') || msg.includes('exists') || msg.includes('taken'));

    const emailTaken =
      msg.includes('email') && (msg.includes('already') || msg.includes('exists') || msg.includes('taken'));

    // ha mindkettő benne van
    if (usernameTaken && emailTaken) {
      return 'Ez a felhasználónév már foglalt. Ez az email cím már foglalt.';
    }

    if (usernameTaken) {
      return 'Ez a felhasználónév már foglalt.';
    }

    if (emailTaken) {
      return 'Ez az email cím már foglalt.';
    }

    // Egyéb backend üzeneteknél: ha van szöveg, mutassuk, de lehet magyarítani később
    return raw || 'A regisztráció nem sikerült.';
  }

  onRegister(form: NgForm) {
    this.errorMessage = '';
    this.successMessage = '';
    form.form.markAllAsTouched();

    if (form.invalid) return;

    this.name = this.name.trim();
    this.email = this.email.trim();

    if (this.password !== this.passwordConfirmation) {
      this.errorMessage = 'A két jelszó nem egyezik.';
      return;
    }

    this.isSubmitting = true;

    const data: RegisterRequest = {
      name: this.name,
      email: this.email,
      password: this.password,
      password_confirmation: this.passwordConfirmation
    };

    this.authService.register(data).subscribe({
      next: (res) => {
        console.log('Sikeres regisztráció (backend válasz):', res);

        this.successMessage =
          'Sikeres regisztráció! Kérlek, ellenőrizd az emailjeidet és erősítsd meg a regisztrációt.';

        this.isSubmitting = false;

        alert('Sikeres regisztráció! Küldtünk egy megerősítő emailt, kérlek ellenőrizd a postafiókodat. 💖');

        this.router.navigate(['/']);
      },
      error: (err) => {
        console.error('Hiba a regisztrációnál 😥', err);
        this.isSubmitting = false;

        // 🔥 innen mindig próbáljuk a backend message-t használni
        const backendMsg =
          err?.error?.message ||
          err?.error?.error ||
          err?.message ||
          '';

        // Ha a backend már mezőnként küldi (errors), azt is kezeljük
        const errors = err?.error?.errors;

        // Példa: { errors: { name: [...], email: [...] } }
        if (errors?.name?.length && errors?.email?.length) {
          // itt is magyarítunk
          this.errorMessage = 'Ez a felhasználónév már foglalt. Ez az email cím már foglalt.';
          return;
        }

        if (errors?.name?.length) {
          this.errorMessage = this.toHuMessage(errors.name[0]);
          return;
        }

        if (errors?.email?.length) {
          this.errorMessage = this.toHuMessage(errors.email[0]);
          return;
        }

        // 400/409/422 -> általában validáció / foglalt adatok
        if (err.status === 400 || err.status === 409 || err.status === 422) {
          this.errorMessage = this.toHuMessage(backendMsg);
          return;
        }

        if (err.status === 500) {
          this.errorMessage = 'Szerver hiba történt a regisztráció közben.';
          return;
        }

        // végső fallback
        this.errorMessage = 'A regisztráció nem sikerült.';
      }
    });
  }
}