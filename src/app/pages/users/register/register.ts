import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService, RegisterRequest } from '../../../services/auth';
import { Router, RouterLink } from '@angular/router';
import { NgIf } from '@angular/common';   // 🌸 EZ AZ ÚJ SOR

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, RouterLink, NgIf],  // 🌸 IDE IS BERAKJUK
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

  onRegister() {
    this.errorMessage = '';
    this.successMessage = '';
    this.isSubmitting = true;

    if (!this.name || !this.email || !this.password || !this.passwordConfirmation) {
      this.errorMessage = 'Minden mező kitöltése kötelező.';
      this.isSubmitting = false;
      return;
    }

    if (this.password !== this.passwordConfirmation) {
      this.errorMessage = 'A két jelszó nem egyezik.';
      this.isSubmitting = false;
      return;
    }

    const data: RegisterRequest = {
      name: this.name,
      email: this.email,
      password: this.password,
      password_confirmation: this.passwordConfirmation
    };

    this.authService.register(data).subscribe({
  next: (res) => {
    console.log('Sikeres regisztráció (backend válasz):', res);

    // 🌸 Üzenet a felületen
    this.successMessage = 'Sikeres regisztráció! Kérlek, ellenőrizd az emailjeidet és erősítsd meg a regisztrációt.';

    this.isSubmitting = false;

    // 🌸 Felugró ablak is, hogy biztosan észrevedd
    alert('Sikeres regisztráció! Küldtünk egy megerősítő emailt, kérlek ellenőrizd a postafiókodat. 💖');

    // 🌸 Ezután vissza a belépő oldalra
    this.router.navigate(['/']);
  },
  error: (err) => {
    console.error('Hiba a regisztrációnál 😥', err);
    this.isSubmitting = false;

    if (err.status === 400) {
      this.errorMessage = 'Hibás adatokkal próbáltál regisztrálni.';
    } else if (err.status === 500) {
      this.errorMessage = 'Szerver hiba történt a regisztráció közben.';
    } else {
      this.errorMessage = 'A regisztráció nem sikerült.';
    }
  }
});

  }
}
