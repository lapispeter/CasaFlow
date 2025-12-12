import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../services/auth';
import { NgIf } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [FormsModule, NgIf, RouterLink],
  templateUrl: './profile.html',
  styleUrls: ['./profile.css']
})
export class Profile implements OnInit {

  // profil adatok
  name: string = '';
  email: string = '';

  // jelszó módosítás mezők
  oldPassword: string = '';
  newPassword: string = '';
  newPasswordConfirm: string = '';

  // üzenetek
  profileSuccess: string = '';
  profileError: string = '';

  passwordSuccess: string = '';
  passwordError: string = '';

  isLoadingProfile: boolean = false;
  isSavingProfile: boolean = false;
  isChangingPassword: boolean = false;

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile() {
    this.isLoadingProfile = true;
    this.profileError = '';
    this.profileSuccess = '';

    try {
      this.authService.getProfile().subscribe({
        next: (res) => {
          console.log('Profil adatok:', res);
          if (res && res.data) {
            this.name = res.data.name;
            this.email = res.data.email;
          }
          this.isLoadingProfile = false;
        },
        error: (err) => {
          console.error('Hiba a profil lekérésénél 😥', err);
          this.profileError = 'Nem sikerült betölteni a profil adatokat.';
          this.isLoadingProfile = false;
        }
      });
    } catch (e) {
      console.error(e);
      this.profileError = 'Nem vagy bejelentkezve.';
      this.isLoadingProfile = false;
    }
  }

  onSaveProfile() {
    this.profileError = '';
    this.profileSuccess = '';
    this.isSavingProfile = true;

    if (!this.name || !this.email) {
      this.profileError = 'A név és az email mező kitöltése kötelező.';
      this.isSavingProfile = false;
      return;
    }

    try {
      this.authService.updateProfile(this.name, this.email).subscribe({
        next: (res) => {
          console.log('Profil frissítve:', res);
          this.profileSuccess = 'A profil adataid sikeresen frissültek.';
          this.isSavingProfile = false;
          alert('Az adataid módosítása sikeres volt. 💖');
        },
        error: (err) => {
          console.error('Hiba a profil frissítésnél 😥', err);
          this.profileError = 'A profil frissítése nem sikerült.';
          this.isSavingProfile = false;
        }
      });
    } catch (e) {
      console.error(e);
      this.profileError = 'Nem vagy bejelentkezve.';
      this.isSavingProfile = false;
    }
  }

  onChangePassword() {
    this.passwordError = '';
    this.passwordSuccess = '';
    this.isChangingPassword = true;

    if (!this.oldPassword || !this.newPassword || !this.newPasswordConfirm) {
      this.passwordError = 'Minden jelszó mező kitöltése kötelező.';
      this.isChangingPassword = false;
      return;
    }

    if (this.newPassword !== this.newPasswordConfirm) {
      this.passwordError = 'Az új jelszó és a megerősítés nem egyezik.';
      this.isChangingPassword = false;
      return;
    }

    try {
      this.authService.changePassword(this.oldPassword, this.newPassword, this.newPasswordConfirm)
        .subscribe({
          next: (res) => {
            console.log('Jelszó módosítva:', res);
            this.passwordSuccess = 'A jelszavad sikeresen megváltozott.';
            this.isChangingPassword = false;

            // mezők ürítése
            this.oldPassword = '';
            this.newPassword = '';
            this.newPasswordConfirm = '';

            alert('A jelszó megváltoztatása sikeres volt. Mostantól az új jelszóval tudsz belépni. 💖');
          },
          error: (err) => {
            console.error('Hiba a jelszó módosításnál 😥', err);

            if (err.status === 401) {
              this.passwordError = 'A régi jelszó nem megfelelő.';
            } else {
              this.passwordError = 'A jelszó módosítása nem sikerült.';
            }

            this.isChangingPassword = false;
          }
        });
    } catch (e) {
      console.error(e);
      this.passwordError = 'Nem vagy bejelentkezve.';
      this.isChangingPassword = false;
    }
  }
}

