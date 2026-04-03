import { Component } from '@angular/core';
import { BillService } from '../../../services/bill-service';
import { DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';

@Component({
  selector: 'app-bill',
  imports: [DatePipe, ReactiveFormsModule, RouterLink],
  templateUrl: './bill.html',
  styleUrl: './bill.css',
})
export class Bill {

  bills: any[] = [];

  billForm: any;
  filterForm: any;

  showModal = false;
  addMode = true;
  selectedBill: any = null;

  showList = false;
  showFilterModal = false;

  noResultsMessage = '';

  successMessage = '';
  errorMessage = '';
  isSaving = false;

  // globális kereső
  focusId: number | null = null;
  searchQ = '';

  // HOME-ról jövő speciális eset:
  // 1 hónapos lista + dátum nélküli számlák is jelenjenek meg
  includeNoDateBillsFromHome = false;

  constructor(
    private api: BillService,
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
      this.includeNoDateBillsFromHome = false;

      // ===== GLOBÁLIS KERESŐ =====
      if (q) {

        this.filterForm.patchValue({
          billTypeMode: 'all',
          billTypeText: '',
          periodMonths: 'all',
          paymentMode: 'all'
        });

        this.applyFilters();
        return;
      }

      // ===== HOME NAVIGÁCIÓ =====
      if (params?.fromHome) {

        const billTypeMode = String(params?.billTypeMode ?? 'all');
        const billTypeText = String(params?.billTypeText ?? '');
        const periodMonths = String(params?.periodMonths ?? '1');
        const paymentMode = String(params?.paymentMode ?? 'all');

        // Home > Számlák csempe:
        // elmúlt 1 hónap + dátum nélküli számlák is
        if (
          billTypeMode === 'all' &&
          billTypeText === '' &&
          periodMonths === '1' &&
          paymentMode === 'all'
        ) {
          this.includeNoDateBillsFromHome = true;
        }

        this.filterForm.patchValue({
          billTypeMode,
          billTypeText,
          periodMonths,
          paymentMode
        });

        this.applyFilters();
      }

    });
  }

  initForms() {

    this.billForm = this.builder.group({
      billType: [''],
      amount: [''],
      date: [''],
      paymentStatus: ['Nem']
    });

    this.filterForm = this.builder.group({
      billTypeMode: ['all'],
      billTypeText: [''],
      periodMonths: ['1'],
      paymentMode: ['all']
    });

  }

  // ===== FILTER MODAL =====

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
      f.billTypeMode === 'custom'
        ? String(f.billTypeText ?? '').trim()
        : '';

    const localNeedle = this.searchQ || typedText;

    const apiBillTypeMode = localNeedle ? 'all' : String(f.billTypeMode);
    const apiBillTypeText = localNeedle ? '' : typedText;

    // Ha Home-ról jövő 1 hónapos lista van,
    // akkor backendből mindent kérünk, és frontendben szűrjük:
    // elmúlt 1 hónap VAGY nincs dátum
    const apiPeriodMonths = this.includeNoDateBillsFromHome
      ? 'all'
      : String(f.periodMonths);

    this.api.getBillsFiltered({
      billTypeMode: String(apiBillTypeMode),
      billTypeText: String(apiBillTypeText),
      periodMonths: apiPeriodMonths,
      paymentMode: String(f.paymentMode)
    }).subscribe({

      next: (res: any) => {

        const list = res.data ?? res;
        const all = Array.isArray(list) ? list : [];

        let filtered = all;

        // Home speciális szűrés:
        // elmúlt 1 hónap + dátum nélküli számlák
        if (this.includeNoDateBillsFromHome) {
          filtered = filtered.filter((b: any) => this.isWithinLastMonthOrNoDate(b?.date));
        }

        if (localNeedle) {

          const parts = this.normalizeText(localNeedle)
            .split(/\s+/)
            .filter(Boolean);

          filtered = filtered.filter((b: any) => {

            const hay = this.normalizeText(
              `${b?.billType ?? ''} ${b?.amount ?? ''} ${b?.paymentStatus ?? ''}`
            );

            return parts.every(p => hay.includes(p));

          });

        }

        this.bills = filtered;

        this.showList = true;
        this.closeFilterModal();

        if (this.bills.length === 0) {

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

        this.noResultsMessage =
          'Hiba történt a lekérdezésnél.';

      }

    });

  }

  // ===== CRUD MODAL =====

  startShowModal() {

    this.addMode = true;
    this.selectedBill = null;

    this.billForm.reset({
      billType: '',
      amount: '',
      date: '',
      paymentStatus: 'Nem'
    });

    this.showModal = true;

  }

  startEdit(bill: any) {

    this.addMode = false;
    this.selectedBill = bill;

    this.billForm.patchValue({
      billType: bill.billType,
      amount: bill.amount,
      date: this.toDateInputValue(bill.date),
      paymentStatus: bill.paymentStatus
    });

    this.showModal = true;

  }

  cancel() {
    this.showModal = false;
  }

  startSave() {

    if (this.isSaving) return;

    this.showModal = false;

    if (this.addMode)
      this.startAddBill();
    else
      this.startUpdateBill();

  }

  startAddBill() {

    if (this.isSaving) return;

    this.isSaving = true;

    const newBill = {
      billType: this.billForm.value.billType,
      amount: this.billForm.value.amount,
      date: this.billForm.value.date ? this.billForm.value.date : null,
      paymentStatus: this.billForm.value.paymentStatus
    };

    this.api.createBill(newBill).subscribe({

      next: () => {

        this.showSuccess('Sikeres rögzítés ✅');

        if (this.showList)
          this.applyFilters();

        this.isSaving = false;

      },

      error: (err) => {

        console.log(err);

        this.showError('Hiba történt a mentésnél.');

        this.isSaving = false;

      }

    });

  }

  startUpdateBill() {

    if (!this.selectedBill?.id) return;
    if (this.isSaving) return;

    this.isSaving = true;

    const updatedBill = {
      billType: this.billForm.value.billType,
      amount: this.billForm.value.amount,
      date: this.billForm.value.date ? this.billForm.value.date : null,
      paymentStatus: this.billForm.value.paymentStatus
    };

    this.api.updateBill(this.selectedBill.id, updatedBill).subscribe({

      next: () => {

        this.showSuccess('Sikeres módosítás ✅');

        if (this.showList)
          this.applyFilters();

        this.isSaving = false;

      },

      error: (err) => {

        console.log(err);

        this.showError('Hiba történt a módosításnál.');

        this.isSaving = false;

      }

    });

  }

  markAsPaid(bill: any) {
    if (!bill?.id) return;
    if (this.isSaving) return;

    this.isSaving = true;

    const updatedBill = {
      billType: bill.billType,
      amount: bill.amount,
      date: this.toDateInputValue(bill.date) || null,
      paymentStatus: 'Igen'
    };

    this.api.updateBill(bill.id, updatedBill).subscribe({

      next: () => {

        this.showSuccess('A számla befizetettként lett jelölve ✅');

        if (this.showList)
          this.applyFilters();

        this.isSaving = false;

      },

      error: (err) => {

        console.log(err);

        this.showError('Hiba történt a frissítésnél.');

        this.isSaving = false;

      }

    });
  }

  startDelete(bill: any) {

    const ok =
      confirm(`Biztos törlöd ezt a számlát? (${bill.billType})`);

    if (!ok) return;

    this.api.deleteBill(bill.id).subscribe({

      next: () => {

        this.showSuccess('Sikeres törlés ✅');

        if (this.showList)
          this.applyFilters();

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

    setTimeout(() =>
      this.successMessage = '',
      2500
    );

  }

  private showError(msg: string) {

    this.errorMessage = msg;
    this.successMessage = '';

    setTimeout(() =>
      this.errorMessage = '',
      4000
    );

  }

  private toDateInputValue(dateValue: any): string {

    if (!dateValue) return '';

    const d = new Date(dateValue);

    if (isNaN(d.getTime()))
      return '';

    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1)
      .padStart(2, '0');
    const dd = String(d.getDate())
      .padStart(2, '0');

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