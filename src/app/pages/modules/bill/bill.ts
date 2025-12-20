import { Component } from '@angular/core';
import { BillService } from '../../../services/bill-service';
import { DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-bill',
  imports: [DatePipe, ReactiveFormsModule],
  templateUrl: './bill.html',
  styleUrl: './bill.css',
})
export class Bill {

  bills!: any[];
  billForm: any;

  showModal = false;
  addMode = true;

  // ✅ ezt eltároljuk módosításhoz/törléshez
  selectedBill: any = null;

  constructor(
    private api: BillService,
    private builder: FormBuilder
  ) {}

  ngOnInit() {
    this.getBills();
    this.initForm();
  }

  initForm() {
    this.billForm = this.builder.group({
      billType: [''],
      amount: [''],
      date: [''],
      paymentStatus: ['Nem']   // ✅ alapérték (opcionális)
    });
  }

  getBills() {
    this.api.getBills().subscribe({
      next: (res: any) => {
        this.bills = res.data;
      },
      error: (err) => console.log(err),
    });
  }

  // ✅ Új számla
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

  // ✅ Módosítás indítása (modal feltöltése)
  startEdit(bill: any) {
    this.addMode = false;
    this.selectedBill = bill;

    this.billForm.patchValue({
      billType: bill.billType,
      amount: bill.amount,
      // ha backend ISO stringet ad, a date input yyyy-MM-dd-t vár:
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

    if (this.addMode) {
      this.startAddBill();
    } else {
      this.startUpdateBill();
    }
  }

  startAddBill() {
    const newBill = {
      billType: this.billForm.value.billType,
      amount: this.billForm.value.amount,
      date: this.billForm.value.date,
      paymentStatus: this.billForm.value.paymentStatus
    };

    this.api.createBill(newBill).subscribe({
      next: () => this.getBills(),
      error: (err) => console.log(err),
    });
  }

  // ✅ UPDATE
  startUpdateBill() {
    if (!this.selectedBill?.id) return;

    const updatedBill = {
      billType: this.billForm.value.billType,
      amount: this.billForm.value.amount,
      date: this.billForm.value.date,
      paymentStatus: this.billForm.value.paymentStatus
    };

   this.api.updateBill(this.selectedBill.id, updatedBill).subscribe({
   next: () => this.getBills(),
   error: (err) => console.log(err),
   });

  }

  // ✅ DELETE
  startDelete(bill: any) {
    // egyszerű confirm
    const ok = confirm(`Biztos törlöd ezt a számlát? (${bill.billType})`);
    if (!ok) return;

    // Feltételezem, hogy van ilyen a service-ben: deleteBill(id)
    this.api.deleteBill(bill.id).subscribe({
      next: () => this.getBills(),
      error: (err) => console.log(err),
    });
  }

  // ✅ segéd: ISO date -> yyyy-MM-dd
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


