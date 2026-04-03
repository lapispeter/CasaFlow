import { Component } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MeterReadingService } from '../../../services/meter-reading-service';

@Component({
  selector: 'app-meter-reading',
  imports: [DatePipe, ReactiveFormsModule, RouterLink],
  templateUrl: './meter-reading.html',
  styleUrl: './meter-reading.css',
})
export class MeterReading {
  readings: any[] = [];

  mrForm: any;
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

  // globális keresőből jövő paramok
  focusId: number | null = null;
  searchQ = '';

  // HOME-ról jövő speciális eset:
  // 1 hónapos lista + dátum nélküli elemek is jelenjenek meg
  includeNoDateReadingsFromHome = false;

  constructor(
    private api: MeterReadingService,
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
      this.includeNoDateReadingsFromHome = false;

      // ===== GLOBÁLIS KERESŐ =====
      if (q) {
        this.filterForm.patchValue({
          meterTypeMode: 'all',
          meterTypeText: '',
          periodMonths: 'all'
        });

        this.applyFilters();
        return;
      }

      // ===== HOME NAVIGÁCIÓ =====
      if (params?.fromHome) {
        const meterTypeMode = String(params?.meterTypeMode ?? 'all');
        const meterTypeText = String(params?.meterTypeText ?? '');
        const periodMonths = String(params?.periodMonths ?? '1');

        if (
          meterTypeMode === 'all' &&
          meterTypeText === '' &&
          periodMonths === '1'
        ) {
          this.includeNoDateReadingsFromHome = true;
        }

        this.filterForm.patchValue({
          meterTypeMode,
          meterTypeText,
          periodMonths
        });

        this.applyFilters();
      }
    });
  }

  initForms() {
    this.mrForm = this.builder.group({
      meterType: [''],
      reading: [''],
      date: ['']
    });

    this.filterForm = this.builder.group({
      meterTypeMode: ['all'],
      meterTypeText: [''],
      periodMonths: ['1']
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

    const typedText =
      f.meterTypeMode === 'custom'
        ? String(f.meterTypeText ?? '').trim()
        : '';

    const localNeedle = this.searchQ || typedText;

    const apiMode = localNeedle ? 'all' : f.meterTypeMode;
    const apiText = localNeedle ? '' : typedText;

    // Home-ról érkező 1 hónapos nézetnél az összeset lekérjük,
    // és frontendben szűrjük úgy, hogy a dátum nélküli elemek is bent maradjanak
    const apiPeriodMonths = this.includeNoDateReadingsFromHome
      ? 'all'
      : String(f.periodMonths);

    this.api.getFiltered({
      meterTypeMode: String(apiMode),
      meterTypeText: String(apiText),
      periodMonths: apiPeriodMonths
    }).subscribe({
      next: (res: any) => {
        const list = res.data ?? res;
        let all = Array.isArray(list) ? list : [];

        // HOME speciális logika:
        // elmúlt 1 hónap + dátum nélküli elemek
        if (this.includeNoDateReadingsFromHome) {
          all = all.filter((r: any) => this.isWithinLastMonthOrNoDate(r?.date));
        }

        let filtered = all;

        if (localNeedle) {
          const parts = this.normalizeText(localNeedle).split(/\s+/).filter(Boolean);

          filtered = all.filter((r: any) => {
            const hay = this.normalizeText(
              `${r?.meterType ?? ''} ${r?.reading ?? ''} ${r?.date ?? ''}`
            );
            return parts.every(p => hay.includes(p));
          });
        }

        this.readings = filtered;

        this.showList = true;
        this.closeFilterModal();

        if (this.readings.length === 0) {
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

    this.mrForm.reset({
      meterType: '',
      reading: '',
      date: ''
    });

    this.showModal = true;
  }

  startEdit(r: any) {
    this.addMode = false;
    this.selected = r;

    this.mrForm.patchValue({
      meterType: r.meterType,
      reading: r.reading,
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
      meterType: this.mrForm.value.meterType,
      reading: this.mrForm.value.reading,
      date: this.mrForm.value.date ? this.mrForm.value.date : null
    };

    this.api.create(payload).subscribe({
      next: () => {
        this.showSuccess('Sikeres rögzítés ✅');
        if (this.showList) this.applyFilters();
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
      meterType: this.mrForm.value.meterType,
      reading: this.mrForm.value.reading,
      date: this.mrForm.value.date ? this.mrForm.value.date : null
    };

    this.api.update(this.selected.id, payload).subscribe({
      next: () => {
        this.showSuccess('Sikeres módosítás ✅');
        if (this.showList) this.applyFilters();
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
    const ok = confirm(`Biztos törlöd ezt a leolvasást? (${r.meterType})`);
    if (!ok) return;

    this.api.delete(r.id).subscribe({
      next: () => {
        this.showSuccess('Sikeres törlés ✅');
        if (this.showList) this.applyFilters();
      },
      error: (err) => {
        console.log(err);
        this.showError('Hiba történt a törlésnél.');
      }
    });
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