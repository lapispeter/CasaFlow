import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../services/auth';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [FormsModule, RouterLink, NgIf],
  templateUrl: './reset-password.html',
  styleUrls: ['./reset-password.css']
})
export class ResetPassword implements OnInit {

  token: string | null = null;

  password: string = '';
  passwordConfirmation: string = '';

  isSubmitting: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // token kiolvasása az URL ?token=... részéből
    this.route.queryParamMap.subscribe(params => {
      this.token = params.get('token');
      if (!this.token) {
        this.errorMessage = 'Hiányzó vagy érvénytelen token.';
      }
    });
  }

  onSubmit() {
    this.errorMessage = '';
    this.successMessage = '';
    this.isSubmitting = true;

    if (!this.token) {
      this.errorMessage = 'Hiányzó token.';
      this.isSubmitting = false;
      return;
    }

    if (!this.password || !this.passwordConfirmation) {
      this.errorMessage = 'Kérlek, töltsd ki mindkét jelszó mezőt.';
      this.isSubmitting = false;
      return;
    }

    if (this.password !== this.passwordConfirmation) {
      this.errorMessage = 'A két jelszó nem egyezik.';
      this.isSubmitting = false;
      return;
    }

this.authService.resetPassword(this.token, this.password, this.passwordConfirmation)
  .subscribe({
    next: (res) => {
      console.log('Reset password response:', res);

      // 🌸 Üzenet a komponensben
      this.successMessage = 'A jelszavad sikeresen megváltozott. Most már bejelentkezhetsz az új jelszóval.';
      this.isSubmitting = false;

      // 🌸 Felugró ablak, hogy biztosan észrevedd
      alert('A jelszó megváltoztatása sikeres volt! Most már bejelentkezhetsz az új jelszóval. 💖');

      // 🌸 Ezután vissza a belépő oldalra
      this.router.navigate(['/']);
    },
    error: (err) => {
      console.error('Hiba a jelszó visszaállításnál 😥', err);
      this.errorMessage = 'A jelszó visszaállítása nem sikerült.';
      this.isSubmitting = false;
    }
  });

  }
}
