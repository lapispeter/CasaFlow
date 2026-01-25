import { Injectable } from '@angular/core';

import { Observable, forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { BillService } from './bill-service';
import { ShoppingListService } from './shopping-list-service';
import { ReminderService } from './reminder-service';
import { MeterReadingService } from './meter-reading-service';

export type SearchDomain = 'bill' | 'shopping' | 'reminder' | 'meter';

export type SearchHit = {
  domain: SearchDomain;
  id: number | string;
  title: string;
  subtitle?: string;
  path: string;
  queryParams?: Record<string, any>;
};

export type SearchGroups = {
  bills: SearchHit[];
  shopping: SearchHit[];
  reminders: SearchHit[];
  meters: SearchHit[];
};

@Injectable({
  providedIn: 'root',
})
export class GlobalSearchService {
  constructor(
    private billApi: BillService,
    private shoppingApi: ShoppingListService,
    private reminderApi: ReminderService,
    private meterApi: MeterReadingService
  ) {}

  search(q: string): Observable<SearchGroups> {
    const needle = (q ?? '').trim();
    if (!needle) {
      return of({ bills: [], shopping: [], reminders: [], meters: [] });
    }

    const bills$ = this.billApi.getBillsFiltered({
      billTypeMode: 'all',
      billTypeText: '',
      periodMonths: 'all',
      paymentMode: 'all'
    }).pipe(
      map((res: any) => {
        const all = this.normalizeList(res);
        const filtered = this.filterList(all, needle, (x) =>
          `${x?.billType ?? ''} ${x?.title ?? ''} ${x?.name ?? ''} ${x?.note ?? ''}`
        );
        return this.mapBills(filtered, needle);
      }),
      catchError((err) => {
        console.log(err);
        return of([] as SearchHit[]);
      })
    );

    const shopping$ = this.shoppingApi.getFiltered({
      titleMode: 'all',
      titleText: '',
      periodMonths: 'all',
      boughtMode: 'all',
      expiryMode: 'all'
    }).pipe(
      map((res: any) => {
        const all = this.normalizeList(res);
        const filtered = this.filterList(all, needle, (x) =>
          `${x?.title ?? ''} ${x?.note ?? ''} ${x?.unit ?? ''} ${x?.quantity ?? ''}`
        );
        return this.mapShopping(filtered, needle);
      }),
      catchError((err) => {
        console.log(err);
        return of([] as SearchHit[]);
      })
    );

    const reminders$ = this.reminderApi.getFiltered({
      titleMode: 'all',
      titleText: '',
      periodMonths: 'all'
    }).pipe(
      map((res: any) => {
        const all = this.normalizeList(res);
        const filtered = this.filterList(all, needle, (x) =>
          `${x?.title ?? ''} ${x?.name ?? ''} ${x?.note ?? ''} ${x?.description ?? ''}`
        );
        return this.mapReminders(filtered, needle);
      }),
      catchError((err) => {
        console.log(err);
        return of([] as SearchHit[]);
      })
    );

    const meters$ = this.meterApi.getFiltered({
      meterTypeMode: 'all',
      meterTypeText: '',
      periodMonths: 'all'
    }).pipe(
      map((res: any) => {
        const all = this.normalizeList(res);
        const filtered = this.filterList(all, needle, (x) =>
          `${x?.meterType ?? ''} ${x?.title ?? ''} ${x?.name ?? ''} ${x?.note ?? ''} ${x?.value ?? ''}`
        );
        return this.mapMeters(filtered, needle);
      }),
      catchError((err) => {
        console.log(err);
        return of([] as SearchHit[]);
      })
    );

    return forkJoin({
      bills: bills$,
      shopping: shopping$,
      reminders: reminders$,
      meters: meters$
    });
  }

  // ----------------- FILTERING (case + ékezet + contains) -----------------

  private filterList(list: any[], q: string, toText: (x: any) => string): any[] {
    const needle = this.normalizeText(q);
    const parts = needle.split(/\s+/).filter(Boolean);

    return list.filter(x => {
      const hay = this.normalizeText(toText(x));
      return parts.every(p => hay.includes(p));
    });
  }

  private normalizeText(s: string): string {
    return String(s ?? '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }

  private normalizeList(res: any): any[] {
    const list = res?.data ?? res;
    return Array.isArray(list) ? list : [];
  }

  private idOf(x: any): number | string {
    return x?.id ?? x?._id ?? x?.Id ?? x?.ID ?? 0;
  }

  // ----------------- MAPPERS -----------------

  private mapBills(list: any[], q: string): SearchHit[] {
    return list.map((x: any) => {
      const id = this.idOf(x);

      const title =
        x?.billType ??
        x?.title ??
        x?.name ??
        'Számla';

      const subtitleParts: string[] = [];
      if (x?.amount != null) subtitleParts.push(`Összeg: ${x.amount}`);
      if (x?.dueDate) subtitleParts.push(`Határidő: ${this.toShortDate(x.dueDate)}`);
      if (x?.isPaid != null) subtitleParts.push(x.isPaid ? 'Fizetve' : 'Nincs fizetve');
      if (x?.note) subtitleParts.push(String(x.note));

      return {
        domain: 'bill',
        id,
        title,
        subtitle: subtitleParts.length ? subtitleParts.join(' • ') : undefined,
        path: '/bill',
        queryParams: { q, focusId: id }
      };
    });
  }

  private mapShopping(list: any[], q: string): SearchHit[] {
    return list.map((x: any) => {
      const id = this.idOf(x);

      const title =
        x?.title ??
        x?.name ??
        'Tétel';

      const subtitleParts: string[] = [];
      if (x?.note) subtitleParts.push(String(x.note));
      if (x?.quantity != null || x?.unit) {
        const qty = x?.quantity != null ? String(x.quantity) : '';
        const unit = x?.unit ? String(x.unit) : '';
        const combined = `${qty} ${unit}`.trim();
        if (combined) subtitleParts.push(combined);
      }
      if (x?.isBought != null) subtitleParts.push(x.isBought ? 'Megvéve' : 'Nincs megvéve');
      if (x?.expiryDate) subtitleParts.push(`Lejárat: ${this.toShortDate(x.expiryDate)}`);

      return {
        domain: 'shopping',
        id,
        title,
        subtitle: subtitleParts.length ? subtitleParts.join(' • ') : undefined,
        path: '/shopping-list',
        queryParams: { q, focusId: id }
      };
    });
  }

  private mapReminders(list: any[], q: string): SearchHit[] {
    return list.map((x: any) => {
      const id = this.idOf(x);

      const title =
        x?.title ??
        x?.name ??
        'Emlékeztető';

      const subtitleParts: string[] = [];
      if (x?.deadline) subtitleParts.push(`Határidő: ${this.toShortDate(x.deadline)}`);
      if (x?.date) subtitleParts.push(`Dátum: ${this.toShortDate(x.date)}`);
      if (x?.note) subtitleParts.push(String(x.note));
      if (x?.description) subtitleParts.push(String(x.description));

      return {
        domain: 'reminder',
        id,
        title,
        subtitle: subtitleParts.length ? subtitleParts.join(' • ') : undefined,
        path: '/reminder',
        queryParams: { q, focusId: id }
      };
    });
  }

  private mapMeters(list: any[], q: string): SearchHit[] {
    return list.map((x: any) => {
      const id = this.idOf(x);

      const title =
        x?.meterType ??
        x?.title ??
        x?.name ??
        'Mérőóra';

      const subtitleParts: string[] = [];
      if (x?.value != null) subtitleParts.push(`Állás: ${x.value}`);
      if (x?.readingDate) subtitleParts.push(`Dátum: ${this.toShortDate(x.readingDate)}`);
      if (x?.note) subtitleParts.push(String(x.note));

      return {
        domain: 'meter',
        id,
        title,
        subtitle: subtitleParts.length ? subtitleParts.join(' • ') : undefined,
        path: '/meter-reading',
        queryParams: { q, focusId: id }
      };
    });
  }

  private toShortDate(v: any): string {
    const d = new Date(v);
    if (isNaN(d.getTime())) return String(v);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }
}