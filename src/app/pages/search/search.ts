import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';

import { GlobalSearchService, SearchGroups, SearchHit } from '../../services/global-search.service';

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
  isLoading = false;

  groups: SearchGroups = { bills: [], shopping: [], reminders: [], meters: [] };

  constructor(
    private route: ActivatedRoute,
    private globalSearch: GlobalSearchService
  ) {}

  ngOnInit(): void {
    this.sub = this.route.queryParamMap.subscribe(params => {
      this.q = (params.get('q') ?? '').trim();
      this.runSearch();
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  get total(): number {
    return (
      this.groups.bills.length +
      this.groups.shopping.length +
      this.groups.reminders.length +
      this.groups.meters.length
    );
  }

  private runSearch(): void {
    if (!this.q) {
      this.groups = { bills: [], shopping: [], reminders: [], meters: [] };
      this.isLoading = false;
      return;
    }

    this.isLoading = true;

    this.globalSearch.search(this.q).subscribe({
      next: (res) => {
        this.groups = res;
        this.isLoading = false;
      },
      error: (err) => {
        console.log(err);
        this.groups = { bills: [], shopping: [], reminders: [], meters: [] };
        this.isLoading = false;
      }
    });
  }

  trackHit(_: number, r: SearchHit) {
    return `${r.domain}-${r.id}`;
  }
}