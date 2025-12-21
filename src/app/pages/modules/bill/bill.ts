import { Component } from '@angular/core';
import { BillService } from '../../../services/bill-service';
import { DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';


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

  // ✅ új: filter modal
  showFilterModal = false;

  // ✅ új: egyszerű üzenet, ha nincs találat
  noResultsMessage = '';

  constructor(private api: BillService, private builder: FormBuilder) {}

  ngOnInit() {
    this.initForms();
    // nem töltünk listát automatikusan
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
      periodMonths: ['1'],       // ✅ string: '1' | '3' | '6' | '12' | 'all'
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

    const billTypeText =
      f.billTypeMode === 'custom'
        ? String(f.billTypeText ?? '').trim()
        : '';

    this.api.getBillsFiltered({
      billTypeMode: f.billTypeMode,
      billTypeText,
      periodMonths: String(f.periodMonths),
      paymentMode: f.paymentMode
      }).subscribe({
      next: (res: any) => {
        const list = res.data ?? res;
        this.bills = Array.isArray(list) ? list : [];

        this.showList = true;
        this.closeFilterModal(); // ✅ művelet után tűnjön el

        if (this.bills.length === 0) {
          // legegyszerűbb jelzés
          this.noResultsMessage = billTypeText
            ? `Nincs ilyen nevű számlád: "${billTypeText}".`
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
    this.showModal = false;

    if (this.addMode) this.startAddBill();
    else this.startUpdateBill();
  }

  startAddBill() {
    const newBill = {
      billType: this.billForm.value.billType,
      amount: this.billForm.value.amount,
      date: this.billForm.value.date,
      paymentStatus: this.billForm.value.paymentStatus
    };

    this.api.createBill(newBill).subscribe({
      next: () => {
        // ha már van lista, frissítsük ugyanazzal a szűréssel
        if (this.showList) this.applyFilters();
      },
      error: (err) => console.log(err),
    });
  }

  startUpdateBill() {
    if (!this.selectedBill?.id) return;

    const updatedBill = {
      billType: this.billForm.value.billType,
      amount: this.billForm.value.amount,
      date: this.billForm.value.date,
      paymentStatus: this.billForm.value.paymentStatus
    };

    this.api.updateBill(this.selectedBill.id, updatedBill).subscribe({
      next: () => {
        if (this.showList) this.applyFilters();
      },
      error: (err) => console.log(err),
    });
  }

  startDelete(bill: any) {
    const ok = confirm(`Biztos törlöd ezt a számlát? (${bill.billType})`);
    if (!ok) return;

    this.api.deleteBill(bill.id).subscribe({
      next: () => {
        if (this.showList) this.applyFilters();
      },
      error: (err) => console.log(err),
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
