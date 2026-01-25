import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth';
import { NgIf } from '@angular/common';

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
  isLoading: boolean = true;

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
        this.isLoading = false;
        return;
      }

      this.authService.verifyEmail(token).subscribe({
        next: (res) => {
          console.log('Verify email response:', res);

          this.error = '';
          this.message = 'Az email címed sikeresen megerősítve. Most már beléphetsz.';
          this.isLoading = false;

          alert('Sikeres regisztráció! Most már beléphetsz. 💖');

          setTimeout(() => {
            this.router.navigate(['/']);
          }, 500);
        },
        error: (err) => {
          console.error('Hiba az email megerősítésnél 😥', err);

          this.error = 'Az email megerősítése nem sikerült (érvénytelen vagy lejárt link).';
          this.message = '';
          this.isLoading = false;
        }
      });
    });
  }
}