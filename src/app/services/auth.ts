import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { Router } from '@angular/router';

export interface LoginResponse {
  id: number;
  name: string;
  email: string;
  accessToken: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private loggedInSubject = new BehaviorSubject<boolean>(
    !!localStorage.getItem('auth')
  );

  loggedIn$ = this.loggedInSubject.asObservable();

  private apiUrl = 'http://localhost:8000/api';

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  /**
   * ✅ Segédfüggvény: backend hibából kiszedi a hasznos üzenetet
   * (pl. err.error.message vagy err.error.error)
   */
  getBackendErrorMessage(err: any): string {
    return (
      err?.error?.message ||
      err?.error?.error ||
      err?.message ||
      'Ismeretlen hiba történt.'
    );
  }

  login(name: string, password: string): Observable<LoginResponse> {
    console.log('Hívott URL (login):', `${this.apiUrl}/login`);
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, {
      name: name,
      password: password
    });
  }

  // ✅ Regisztrációs hívás a /register végpontra
  register(data: RegisterRequest): Observable<any> {
    console.log('Hívott URL (register):', `${this.apiUrl}/register`);
    return this.http.post<any>(`${this.apiUrl}/register`, data);
  }

  // ✅ Elfelejtett jelszó – csak emailt küldünk a backendnek
  forgotPassword(email: string) {
    console.log('Hívott URL (forgot-password):', `${this.apiUrl}/forgot-password`);
    return this.http.post<any>(`${this.apiUrl}/forgot-password`, { email });
  }

  // ✅ Új jelszó beállítása a backend /reset-password végpontján
  resetPassword(token: string, password: string, passwordConfirmation: string) {
    return this.http.post<any>(`${this.apiUrl}/reset-password`, {
      token: token,
      password: password,
      password_confirmation: passwordConfirmation
    });
  }

  // ✅ Profil (user adatok) lekérdezése
  getProfile() {
    const id = this.getCurrentUserId();
    const token = this.getToken();

    if (!id || !token) {
      throw new Error('Nincs bejelentkezett felhasználó.');
    }

    return this.http.get<any>(`${this.apiUrl}/users/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  // ✅ Profil (név + email) frissítése
  updateProfile(name: string, email: string) {
    const id = this.getCurrentUserId();
    const token = this.getToken();

    if (!id || !token) {
      throw new Error('Nincs bejelentkezett felhasználó.');
    }

    return this.http.put<any>(`${this.apiUrl}/users/${id}`, { name, email }, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  // ✅ Jelszó módosítása régi jelszó ellenőrzéssel
  changePassword(oldPassword: string, newPassword: string, confirmation: string) {
    const id = this.getCurrentUserId();
    const token = this.getToken();

    if (!id || !token) {
      throw new Error('Nincs bejelentkezett felhasználó.');
    }

    return this.http.put<any>(`${this.apiUrl}/users/${id}/password`, {
      old_password: oldPassword,
      password: newPassword,
      password_confirmation: confirmation
    }, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  // ✅ Email megerősítése a backend /verify-email végpontjával
  verifyEmail(token: string) {
    return this.http.get<any>(`${this.apiUrl}/verify-email`, {
      params: { token }
    });
  }

  // ✅ Login válasz elmentése (localStorage)
  setSession(res: LoginResponse) {
    localStorage.setItem('auth', JSON.stringify(res));
    this.loggedInSubject.next(true);
  }

  getCurrentUserId(): number | null {
    const auth = localStorage.getItem('auth');
    if (!auth) return null;
    try {
      const data = JSON.parse(auth) as LoginResponse;
      return data.id;
    } catch {
      return null;
    }
  }

  getToken(): string | null {
    const auth = localStorage.getItem('auth');
    if (!auth) return null;
    try {
      const data = JSON.parse(auth) as LoginResponse;
      return data.accessToken;
    } catch {
      return null;
    }
  }

  getCurrentUserName(): string {
    const auth = localStorage.getItem('auth');
    if (!auth) return '';
    try {
      const data = JSON.parse(auth) as LoginResponse;
      return data.name ?? '';
    } catch {
      return '';
    }
  }

  logout() {
    localStorage.removeItem('auth');
    this.loggedInSubject.next(false);
    this.router.navigate(['/login']);
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('auth');
  }

  // ============================================================
  // ✅ OPCIONÁLIS: “foglalt-e?” ellenőrzések (csak akkor működik,
  // ha csinálsz hozzá backend endpointot!)
  //
  // Példa backend:
  // GET /api/check-username?name=Barbara  -> { exists: true/false }
  // GET /api/check-email?email=a@b.com    -> { exists: true/false }
  // ============================================================

  checkUsernameExists(name: string): Observable<{ exists: boolean }> {
    return this.http.get<{ exists: boolean }>(`${this.apiUrl}/check-username`, {
      params: { name }
    });
  }

  checkEmailExists(email: string): Observable<{ exists: boolean }> {
    return this.http.get<{ exists: boolean }>(`${this.apiUrl}/check-email`, {
      params: { email }
    });
  }
}