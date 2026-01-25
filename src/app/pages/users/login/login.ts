import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../services/auth';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class Login {

  username: string = '';
  password: string = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  onLogin() {
    console.log('Belépés próbálkozás…');

    this.authService.login(this.username, this.password).subscribe({
      next: (res) => {
        console.log('Sikeres bejelentkezés! 🎉');
        console.log('Válasz:', res);

        // Login adatokat elmentjük
        this.authService.setSession(res);

        this.router.navigate(['/home']);
      },
      error: (err) => {
        console.error('Hiba a bejelentkezésnél 😥', err);
      }
    });
  }
}