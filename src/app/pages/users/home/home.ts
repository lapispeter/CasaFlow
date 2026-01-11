import { Component, OnInit } from '@angular/core';
import { RouterModule, Router } from '@angular/router';

import { AuthService } from '../../../services/auth';
import { BillService } from '../../../services/bill-service';
import { ReminderService } from '../../../services/reminder-service';
import { ShoppingListService } from '../../../services/shopping-list-service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './home.html',
  styleUrls: ['./home.css']
})
export class Home implements OnInit {

  name = '';

  unpaidBillsCount = 0;
  todayRemindersCount = 0;
  shoppingOpenCount = 0;

  constructor(
    private authService: AuthService,
    private billService: BillService,
    private reminderService: ReminderService,
    private shoppingService: ShoppingListService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // EREDETI LOGIKA: maradjon meg
    this.name = this.authService.getCurrentUserName();

    // ÚJ: számlálók betöltése
    this.loadCounts();
  }

  // EREDETI LOGIKA: maradjon meg
  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  loadCounts() {
    // 1) Fizetetlen számlák (paymentMode=Nem, minden idő, összes típus)
    this.billService.getBillsFiltered({
      billTypeMode: 'all',
      billTypeText: '',
      periodMonths: 'all',
      paymentMode: 'Nem'
    }).subscribe({
      next: (res: any) => {
        const list = res?.data ?? res;
        this.unpaidBillsCount = Array.isArray(list) ? list.length : 0;
      },
      error: () => {
        this.unpaidBillsCount = 0;
      }
    });

    // 2) Mai emlékeztetők – összes lekérése és frontend szűrés "mára"
    this.reminderService.getFiltered({
      titleMode: 'all',
      titleText: '',
      periodMonths: 'all'
    }).subscribe({
      next: (res: any) => {
        const list = res?.data ?? res;
        const reminders = Array.isArray(list) ? list : [];
        const today = new Date();

        this.todayRemindersCount = reminders.filter((r: any) => {
          if (!r?.date) return false;
          const d = new Date(r.date);
          return d.getFullYear() === today.getFullYear()
            && d.getMonth() === today.getMonth()
            && d.getDate() === today.getDate();
        }).length;
      },
      error: () => {
        this.todayRemindersCount = 0;
      }
    });

    // 3) Bevásárló lista – nincs megvéve tételek
    this.shoppingService.getFiltered({
      titleMode: 'all',
      titleText: '',
      periodMonths: 'all',
      boughtMode: 'false',
      expiryMode: 'all'
    }).subscribe({
      next: (res: any) => {
        const list = res?.data ?? res;
        this.shoppingOpenCount = Array.isArray(list) ? list.length : 0;
      },
      error: () => {
        this.shoppingOpenCount = 0;
      }
    });
  }

  // --- Navigációk: Home -> előszűrt listák ---
  goUnpaidBills() {
    this.router.navigate(['/bill'], {
      queryParams: {
        billTypeMode: 'all',
        billTypeText: '',
        periodMonths: 'all',
        paymentMode: 'Nem',
        fromHome: 1
      }
    });
  }

  goTodayReminders() {
    this.router.navigate(['/reminder'], {
      queryParams: { fromHome: 1 }
    });
  }

  goShoppingOpen() {
    this.router.navigate(['/shopping-list'], {
      queryParams: {
        titleMode: 'all',
        titleText: '',
        periodMonths: 'all',
        boughtMode: 'false',
        expiryMode: 'all',
        fromHome: 1
      }
    });
  }
}
