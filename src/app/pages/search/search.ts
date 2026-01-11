import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';

type LinkItem = { label: string; path: string; keywords: string[] };

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './search.html',
  styleUrls: ['./search.css']
})
export class Search implements OnInit, OnDestroy {
  private sub?: Subscription;

  q = '';
  results: LinkItem[] = [];

  private all: LinkItem[] = [
    { label: 'Profil', path: '/profile', keywords: ['profil', 'adatok', 'user'] },
    { label: 'Számlák', path: '/bill', keywords: ['számla', 'szamlak', 'bill', 'fizetés', 'fizetes'] },
    { label: 'Mérőóra leolvasások', path: '/meter-reading', keywords: ['mérő', 'mero', 'leolvasás', 'leolvasas', 'óra', 'meter'] },
    { label: 'Emlékeztetők', path: '/reminder', keywords: ['emlékeztető', 'emlekezteto', 'reminder', 'határidő', 'hatarido'] },
    { label: 'Bevásárló lista', path: '/shopping-list', keywords: ['bevásárló', 'bevasarlo', 'lista', 'shopping', 'kosár', 'kosar'] },
  ];

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.sub = this.route.queryParamMap.subscribe(params => {
      this.q = (params.get('q') ?? '').trim();
      this.filter();
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  private filter(): void {
    const needle = this.q.toLowerCase();
    if (!needle) {
      this.results = [];
      return;
    }

    this.results = this.all.filter(x => {
      const hay = (x.label + ' ' + x.keywords.join(' ')).toLowerCase();
      return hay.includes(needle);
    });
  }
}
