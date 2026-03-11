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

    // felhasználó neve
    this.name = this.authService.getCurrentUserName();

    // számlálók betöltése
    this.loadCounts();
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  loadCounts() {

    // 1️⃣ Fizetetlen számlák
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

    // 2️⃣ Mai emlékeztetők
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

    // 3️⃣ Bevásárló lista – nincs megvéve
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


  // =============================
  // FELSŐ CSEMPEK (maradnak)
  // =============================

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


  // =============================
  // ALSÓ MODUL CSEMPEK
  // (1 hónap automatikus lista)
  // =============================

  goBillsLastMonth() {
    this.router.navigate(['/bill'], {
      queryParams: {
        billTypeMode: 'all',
        billTypeText: '',
        periodMonths: '1',
        paymentMode: 'all',
        fromHome: 1
      }
    });
  }

  goRemindersLastMonth() {
    this.router.navigate(['/reminder'], {
      queryParams: {
        titleMode: 'all',
        titleText: '',
        periodMonths: '1',
        fromHome: 1
      }
    });
  }

  goShoppingLastMonth() {
    this.router.navigate(['/shopping-list'], {
      queryParams: {
        titleMode: 'all',
        titleText: '',
        periodMonths: '1',
        boughtMode: 'all',
        expiryMode: 'all',
        fromHome: 1
      }
    });
  }

  goMeterReadingsLastMonth() {
    this.router.navigate(['/meter-reading'], {
      queryParams: {
        meterTypeMode: 'all',
        meterTypeText: '',
        periodMonths: '1',
        fromHome: 1
      }
    });
  }

}