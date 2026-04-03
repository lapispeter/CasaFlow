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

  successMessage = '';
  errorMessage = '';
  isSaving = false;

  private isTodayMode = false;

  // HOME-ról jövő speciális eset:
  // 1 hónapos lista + dátum nélküli emlékeztetők is jelenjenek meg
  private includeNoDateRemindersFromHome = false;

  // globális keresőből jövő paramok
  focusId: number | null = null;
  searchQ = '';

  constructor(
    private api: ReminderService,
    private builder: FormBuilder,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.initForms();

    this.route.queryParams.subscribe((params: any) => {
      const q = String(params?.q ?? '').trim();
      const focusIdRaw = params?.focusId;

      this.searchQ = q;
      this.focusId = focusIdRaw != null ? Number(focusIdRaw) : null;
      this.includeNoDateRemindersFromHome = false;

      // ===== GLOBÁLIS KERESŐ =====
      if (q) {
        this.isTodayMode = false;

        this.filterForm.patchValue({
          titleMode: 'all',
          titleText: '',
          periodMonths: 'all'
        });

        this.applyFilters();
        return;
      }

      // ===== HOME NAVIGÁCIÓ =====
      if (params?.fromHome) {
        const titleMode = String(params?.titleMode ?? 'all');
        const titleText = String(params?.titleText ?? '');
        const periodMonths = String(params?.periodMonths ?? '1');

        // felső csempe: ma
        if (!params?.titleMode && !params?.titleText && !params?.periodMonths) {
          this.isTodayMode = true;
          this.includeNoDateRemindersFromHome = false;
          this.loadTodayReminders();
          return;
        }

        // alsó modulcsempe: elmúlt 1 hónap
        this.isTodayMode = false;

        if (
          titleMode === 'all' &&
          titleText === '' &&
          periodMonths === '1'
        ) {
          this.includeNoDateRemindersFromHome = true;
        }

        this.filterForm.patchValue({
          titleMode,
          titleText,
          periodMonths
        });

        this.applyFilters();
      }
    });
  }

  initForms() {
    this.reminderForm = this.builder.group({
      title: [''],
      description: [''],
      date: ['']
    });

    this.filterForm = this.builder.group({
      titleMode: ['all'],
      titleText: [''],
      periodMonths: ['1']
    });
  }

  // Home-ról: "ma" szűrés (frontend)
  loadTodayReminders() {
    this.noResultsMessage = '';

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
    // ha manuálisan szűr, onnantól nem "ma" mód
    this.isTodayMode = false;

    const f = this.filterForm.value;

    const typedText =
      f.titleMode === 'custom'
        ? String(f.titleText ?? '').trim()
        : '';

    const localNeedle = this.searchQ || typedText;

    const apiMode = localNeedle ? 'all' : f.titleMode;
    const apiText = localNeedle ? '' : typedText;

    // Home-ról érkező 1 hónapos nézetnél az összeset lekérjük,
    // és frontendben szűrjük úgy, hogy a dátum nélküli elemek is bent maradjanak
    const apiPeriodMonths = this.includeNoDateRemindersFromHome
      ? 'all'
      : String(f.periodMonths);

    this.api.getFiltered({
      titleMode: String(apiMode),
      titleText: String(apiText),
      periodMonths: apiPeriodMonths
    }).subscribe({
      next: (res: any) => {
        const list = res.data ?? res;
        let all = Array.isArray(list) ? list : [];

        // HOME speciális logika:
        // elmúlt 1 hónap + dátum nélküli emlékeztetők
        if (this.includeNoDateRemindersFromHome) {
          all = all.filter((r: any) => this.isWithinLastMonthOrNoDate(r?.date));
        }

        let filtered = all;

        if (localNeedle) {
          const parts = this.normalizeText(localNeedle).split(/\s+/).filter(Boolean);

          filtered = all.filter((r: any) => {
            const hay = this.normalizeText(
              `${r?.title ?? ''} ${r?.description ?? ''} ${r?.date ?? ''}`
            );
            return parts.every(p => hay.includes(p));
          });
        }

        this.reminders = filtered;

        this.showList = true;
        this.closeFilterModal();

        if (this.reminders.length === 0) {
          this.noResultsMessage = localNeedle
            ? `Nincs találat erre: "${localNeedle}".`
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
    if (this.isSaving) return;

    this.showModal = false;
    if (this.addMode) this.startAdd();
    else this.startUpdate();
  }

  startAdd() {
    if (this.isSaving) return;
    this.isSaving = true;

    const payload = {
      title: this.reminderForm.value.title,
      description: this.reminderForm.value.description,
      date: this.reminderForm.value.date ? this.reminderForm.value.date : null
    };

    this.api.create(payload).subscribe({
      next: () => {
        this.showSuccess('Sikeres rögzítés ✅');
        this.refreshListAfterCrud();
        this.isSaving = false;
      },
      error: (err) => {
        console.log(err);
        this.showError('Hiba történt a mentésnél.');
        this.isSaving = false;
      }
    });
  }

  startUpdate() {
    if (!this.selected?.id) return;
    if (this.isSaving) return;
    this.isSaving = true;

    const payload = {
      title: this.reminderForm.value.title,
      description: this.reminderForm.value.description,
      date: this.reminderForm.value.date ? this.reminderForm.value.date : null
    };

    this.api.update(this.selected.id, payload).subscribe({
      next: () => {
        this.showSuccess('Sikeres módosítás ✅');
        this.refreshListAfterCrud();
        this.isSaving = false;
      },
      error: (err) => {
        console.log(err);
        this.showError('Hiba történt a módosításnál.');
        this.isSaving = false;
      }
    });
  }

  startDelete(r: any) {
    const ok = confirm(`Biztos törlöd ezt az emlékeztetőt? (${r.title})`);
    if (!ok) return;

    this.api.delete(r.id).subscribe({
      next: () => {
        this.showSuccess('Sikeres törlés ✅');
        this.refreshListAfterCrud();
      },
      error: (err) => {
        console.log(err);
        this.showError('Hiba történt a törlésnél.');
      }
    });
  }

  private refreshListAfterCrud() {
    if (!this.showList) return;

    if (this.isTodayMode) this.loadTodayReminders();
    else this.applyFilters();
  }

  private showSuccess(msg: string) {
    this.successMessage = msg;
    this.errorMessage = '';
    setTimeout(() => (this.successMessage = ''), 2500);
  }

  private showError(msg: string) {
    this.errorMessage = msg;
    this.successMessage = '';
    setTimeout(() => (this.errorMessage = ''), 4000);
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

  private isWithinLastMonthOrNoDate(dateValue: any): boolean {
    if (!dateValue) return true;

    const d = new Date(dateValue);
    if (isNaN(d.getTime())) return true;

    const today = new Date();
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(today.getMonth() - 1);

    return d >= oneMonthAgo && d <= today;
  }

  private normalizeText(s: string): string {
    return String(s ?? '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }
}