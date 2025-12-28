import { Component } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ReminderService } from '../../../services/reminder-service';

@Component({
  selector: 'app-reminder',
  imports: [DatePipe, ReactiveFormsModule, RouterLink],
  templateUrl: './reminder.html',
  styleUrl: './reminder.css',
})
export class Reminder {
  reminders: any[] = [];

  reminderForm: any;
  filterForm: any;

  showModal = false;
  addMode = true;
  selected: any = null;

  showList = false;
  showFilterModal = false;

  noResultsMessage = '';

  constructor(
    private api: ReminderService,
    private builder: FormBuilder,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.initForms();

    // ✅ Ha Home-ról jövünk, automatikusan listázza a "mai" emlékeztetőket
    this.route.queryParams.subscribe((params: any) => {
      if (params?.fromHome) {
        this.loadTodayReminders();
      }
    });
  }

  initForms() {
    // CRUD
    this.reminderForm = this.builder.group({
      title: [''],
      description: [''],
      date: ['']
    });

    // Filter
    this.filterForm = this.builder.group({
      titleMode: ['all'],      // all | custom
      titleText: [''],
      periodMonths: ['1']      // '1'|'3'|'6'|'12'|'all'
    });
  }

  // ✅ Home-ról: "ma" szűrés (frontend)
  loadTodayReminders() {
    this.noResultsMessage = '';

    // Lekérjük az összeset, és kiszűrjük mára
    this.api.getFiltered({
      titleMode: 'all',
      titleText: '',
      periodMonths: 'all'
    }).subscribe({
      next: (res: any) => {
        const list = res.data ?? res;
        const all = Array.isArray(list) ? list : [];

        const today = new Date();

        this.reminders = all.filter((r: any) => {
          if (!r?.date) return false;
          const d = new Date(r.date);
          return d.getFullYear() === today.getFullYear()
            && d.getMonth() === today.getMonth()
            && d.getDate() === today.getDate();
        });

        this.showList = true;
        this.closeFilterModal();

        if (this.reminders.length === 0) {
          this.noResultsMessage = 'Ma nincs emlékeztetőd.';
        } else {
          this.noResultsMessage = '';
        }
      },
      error: (err) => {
        console.log(err);
        this.noResultsMessage = 'Hiba történt a lekérdezésnél.';
      }
    });
  }

  // ------ FILTER MODAL ------
  openFilterModal() {
    this.noResultsMessage = '';
    this.showFilterModal = true;
  }

  closeFilterModal() {
    this.showFilterModal = false;
  }

  applyFilters() {
    const f = this.filterForm.value;

    const titleText =
      f.titleMode === 'custom'
        ? String(f.titleText ?? '').trim()
        : '';

    this.api.getFiltered({
      titleMode: f.titleMode,
      titleText,
      periodMonths: String(f.periodMonths)
    }).subscribe({
      next: (res: any) => {
        const list = res.data ?? res;
        this.reminders = Array.isArray(list) ? list : [];

        this.showList = true;
        this.closeFilterModal();

        if (this.reminders.length === 0) {
          this.noResultsMessage = titleText
            ? `Nincs ilyen című emlékeztetőd: "${titleText}".`
            : 'Nincs találat a megadott szűrésre.';
        } else {
          this.noResultsMessage = '';
        }
      },
      error: (err) => {
        console.log(err);
        this.closeFilterModal();
        this.noResultsMessage = 'Hiba történt a lekérdezésnél.';
      }
    });
  }

  // ------ CRUD MODAL ------
  startShowModal() {
    this.addMode = true;
    this.selected = null;

    this.reminderForm.reset({
      title: '',
      description: '',
      date: ''
    });

    this.showModal = true;
  }

  startEdit(r: any) {
    this.addMode = false;
    this.selected = r;

    this.reminderForm.patchValue({
      title: r.title,
      description: r.description ?? '',
      date: this.toDateInputValue(r.date)
    });

    this.showModal = true;
  }

  cancel() {
    this.showModal = false;
  }

  startSave() {
    this.showModal = false;
    if (this.addMode) this.startAdd();
    else this.startUpdate();
  }

  startAdd() {
    const payload = {
      title: this.reminderForm.value.title,
      description: this.reminderForm.value.description,
      date: this.reminderForm.value.date
    };

    this.api.create(payload).subscribe({
      next: () => {
        // ✅ Ha listában vagyunk, frissítsük: ha Home-ról jöttünk, akkor maradjon "ma"
        if (this.showList) {
          this.loadTodayReminders();
        }
      },
      error: (err) => console.log(err)
    });
  }

  startUpdate() {
    if (!this.selected?.id) return;

    const payload = {
      title: this.reminderForm.value.title,
      description: this.reminderForm.value.description,
      date: this.reminderForm.value.date
    };

    this.api.update(this.selected.id, payload).subscribe({
      next: () => {
        if (this.showList) {
          this.loadTodayReminders();
        }
      },
      error: (err) => console.log(err)
    });
  }

  startDelete(r: any) {
    const ok = confirm(`Biztos törlöd ezt az emlékeztetőt? (${r.title})`);
    if (!ok) return;

    this.api.delete(r.id).subscribe({
      next: () => {
        if (this.showList) {
          this.loadTodayReminders();
        }
      },
      error: (err) => console.log(err)
    });
  }

  private toDateInputValue(dateValue: any): string {
    if (!dateValue) return '';
    const d = new Date(dateValue);
    if (isNaN(d.getTime())) return '';
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }
}
