import { Component, HostListener } from '@angular/core';
import { Router, NavigationEnd, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';
import { AuthService } from '../../services/auth';

type MenuItem = { label: string; path: string; icon?: string };

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './header.html',
  styleUrls: ['./header.css']
})
export class Header {
  query = '';
  isLoggedIn$;
  isMenuOpen = false;

  // aktuális útvonal (pl. /bill)
  currentPath = '';

  menuItems: MenuItem[] = [
    { label: 'Profil', path: '/profile', icon: '👤' },
    { label: 'Számlák', path: '/bill', icon: '🧾' },
    { label: 'Mérőóra leolvasások', path: '/meter-reading', icon: '📟' },
    { label: 'Emlékeztetők', path: '/reminder', icon: '⏰' },
    { label: 'Bevásárló lista', path: '/shopping-list', icon: '🛒' },
  ];

  constructor(
    public auth: AuthService,
    private router: Router
  ) {
    this.isLoggedIn$ = this.auth.loggedIn$;

    // induláskor
    this.currentPath = this.router.url.split('?')[0];

    // route váltáskor frissítjük + menüt bezárjuk
    this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(() => {
      this.currentPath = this.router.url.split('?')[0];
      this.isMenuOpen = false;
    });
  }

  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }

  closeMenu(): void {
    this.isMenuOpen = false;
  }

  onSearch(): void {
    const q = this.query.trim();
    if (!q) return;
    this.router.navigate(['/search'], { queryParams: { q } });
  }

  isCurrent(path: string): boolean {
    return this.currentPath === path;
  }

  @HostListener('document:keydown.escape')
  onEsc(): void {
    this.closeMenu();
  }
}
