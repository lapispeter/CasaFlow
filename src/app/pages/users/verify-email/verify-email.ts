import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../services/auth';
import { NgIf } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [NgIf, RouterLink],
  templateUrl: './verify-email.html',
  styleUrls: ['./verify-email.css']
})
export class VerifyEmail implements OnInit {

  message: string = 'Email ellenőrzése folyamatban…';
  error: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.route.queryParamMap.subscribe(params => {
      const token = params.get('token');

      if (!token) {
        this.error = 'Hiányzó vagy érvénytelen token.';
        this.message = '';
        return;
      }

      this.authService.verifyEmail(token).subscribe({
        next: (res) => {
          console.log('Verify email response:', res);
          this.message = 'Az email címed sikeresen megerősítve. Most már beléphetsz.';

          // 🌸 Felugró ablak, ahogy kérted
          alert('Sikeres regisztráció! Most már beléphetsz. 💖');

          // Vissza a belépő oldalra
          this.router.navigate(['/']);
        },
        error: (err) => {
          console.error('Hiba az email megerősítésnél 😥', err);
          this.error = 'Az email megerősítése nem sikerült (érvénytelen vagy lejárt link).';
          this.message = '';
        }
      });
    });
  }
}
