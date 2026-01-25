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

  // ✅ Globális keresőből jövő paramok
  focusId: number | null = null;
  searchQ = '';

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

      // ✅ Ha keresőből jövünk, ez legyen az első
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

      // ✅ Ha Home-ról jövünk, fizetendők
      if (params?.fromHome) {
        this.searchQ = '';

        this.filterForm.patchValue({
          billTypeMode: 'all',
          billTypeText: '',
          periodMonths: 'all',
          paymentMode: 'Nem'
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
      billTypeMode: ['all'],     // all | custom
      billTypeText: [''],
      periodMonths: ['1'],       // '1' | '3' | '6' | '12' | 'all'
      paymentMode: ['all']
    });
  }

  // ------- FILTER MODAL -------
  openFilterModal() {
    this.noResultsMessage = '';
    this.showFilterModal = true;
  }

  closeFilterModal() {
    this.showFilterModal = false;
  }

  applyFilters() {
    const f = this.filterForm.value;

    // ha a modalban custom szöveget ír be
    const typedText =
      f.billTypeMode === 'custom'
        ? String(f.billTypeText ?? '').trim()
        : '';

    // amit ténylegesen keresünk:
    // - ha a globális keresőből jött q, akkor az a nyerő
    // - különben a kézzel beírt custom szöveg
    const localNeedle = this.searchQ || typedText;

    // ✅ HA VAN keresőkifejezés:
    // 1) backendből "all" lekérés (hogy ne bukjunk el a case/ékezet miatt)
    // 2) frontend szűrés normalize + contains
    const apiBillTypeMode = localNeedle ? 'all' : f.billTypeMode;
    const apiBillTypeText = localNeedle ? '' : typedText;

    this.api.getBillsFiltered({
      billTypeMode: String(apiBillTypeMode),
      billTypeText: String(apiBillTypeText),
      periodMonths: String(f.periodMonths),
      paymentMode: String(f.paymentMode)
    }).subscribe({
      next: (res: any) => {
        const list = res.data ?? res;
        const all = Array.isArray(list) ? list : [];

        let filtered = all;

        if (localNeedle) {
          const parts = this.normalizeText(localNeedle).split(/\s+/).filter(Boolean);

          filtered = all.filter((b: any) => {
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
        this.noResultsMessage = 'Hiba történt a lekérdezésnél.';
      }
    });
  }

  // ------- CRUD MODAL -------
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

    if (this.addMode) this.startAddBill();
    else this.startUpdateBill();
  }

  startAddBill() {
    if (this.isSaving) return;
    this.isSaving = true;

    const newBill = {
      billType: this.billForm.value.billType,
      amount: this.billForm.value.amount,
      date: this.billForm.value.date,
      paymentStatus: this.billForm.value.paymentStatus
    };

    this.api.createBill(newBill).subscribe({
      next: () => {
        this.showSuccess('Sikeres rögzítés ✅');
        if (this.showList) this.applyFilters();
        this.isSaving = false;
      },
      error: (err) => {
        console.log(err);
        this.showError('Hiba történt a mentésnél.');
        this.isSaving = false;
      },
    });
  }

  startUpdateBill() {
    if (!this.selectedBill?.id) return;
    if (this.isSaving) return;
    this.isSaving = true;

    const updatedBill = {
      billType: this.billForm.value.billType,
      amount: this.billForm.value.amount,
      date: this.billForm.value.date,
      paymentStatus: this.billForm.value.paymentStatus
    };

    this.api.updateBill(this.selectedBill.id, updatedBill).subscribe({
      next: () => {
        this.showSuccess('Sikeres módosítás ✅');
        if (this.showList) this.applyFilters();
        this.isSaving = false;
      },
      error: (err) => {
        console.log(err);
        this.showError('Hiba történt a módosításnál.');
        this.isSaving = false;
      },
    });
  }

  startDelete(bill: any) {
    const ok = confirm(`Biztos törlöd ezt a számlát? (${bill.billType})`);
    if (!ok) return;

    this.api.deleteBill(bill.id).subscribe({
      next: () => {
        this.showSuccess('Sikeres törlés ✅');
        if (this.showList) this.applyFilters();
      },
      error: (err) => {
        console.log(err);
        this.showError('Hiba történt a törlésnél.');
      },
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

  private normalizeText(s: string): string {
    return String(s ?? '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }
}