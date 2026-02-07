import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../services/auth';
import { Router, RouterLink } from '@angular/router';
import { SystemMessageService } from '../../../services/system-message-service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class Login implements OnInit {

  username: string = '';
  password: string = '';

  // ✅ System message
  systemMessage: string = '';

  constructor(
    private authService: AuthService,
    private router: Router,
    private sysMsg: SystemMessageService
  ) {}

  ngOnInit(): void {
    this.sysMsg.getSystemMessage().subscribe({
      next: (res: any) => {
        const d = res.data ?? res;
        this.systemMessage = String(d?.message ?? '').trim();
      },
      error: (err) => console.log(err)
    });
  }

  onLogin() {
    this.authService.login(this.username, this.password).subscribe({
      next: (res) => {
        // ✅ session mentés (token)
        this.authService.setSession(res);

        // ✅ role lekérés a profilból, és aszerint navigálás
        this.authService.getProfile().subscribe({
          next: (profileRes: any) => {
            const user = profileRes?.data ?? profileRes;

            // roleId: 1 = admin (nálatok így)
            if (user?.roleId === 1) {
              this.router.navigate(['/admin']);
            } else {
              this.router.navigate(['/home']);
            }
          },
          error: (err) => {
            console.log('Profile load error:', err);
            // ha valamiért nem jön profile, legalább menjen home-ra
            this.router.navigate(['/home']);
          }
        });
      },
      error: (err) => {
        console.error('Hiba a bejelentkezésnél 😥', err);
      }
    });
  }
}
