import { Component } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
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

  constructor(private api: MeterReadingService, private builder: FormBuilder) {}

  ngOnInit() {
    this.initForms();
  }

  initForms() {
    // CRUD
    this.mrForm = this.builder.group({
      meterType: [''],
      reading: [''],
      date: ['']
    });

    // Filter
    this.filterForm = this.builder.group({
      meterTypeMode: ['all'],   // all | custom
      meterTypeText: [''],      // víz/gáz...
      periodMonths: [1]         // 1/3/6
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

    const meterTypeText =
      f.meterTypeMode === 'custom'
        ? String(f.meterTypeText ?? '').trim()
        : '';

    this.api.getFiltered({
      meterTypeMode: f.meterTypeMode,
      meterTypeText,
      periodMonths: f.periodMonths
    }).subscribe({
      next: (res: any) => {
        const list = res.data ?? res;
        this.readings = Array.isArray(list) ? list : [];

        this.showList = true;
        this.closeFilterModal();

        if (this.readings.length === 0) {
          this.noResultsMessage = meterTypeText
            ? `Nincs ilyen nevű leolvasásod: "${meterTypeText}".`
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
    this.showModal = false;
    if (this.addMode) this.startAdd();
    else this.startUpdate();
  }

  startAdd() {
    const payload = {
      meterType: this.mrForm.value.meterType,
      reading: this.mrForm.value.reading,
      date: this.mrForm.value.date
    };

    this.api.create(payload).subscribe({
      next: () => {
        if (this.showList) this.applyFilters();
      },
      error: (err) => console.log(err)
    });
  }

  startUpdate() {
    if (!this.selected?.id) return;

    const payload = {
      meterType: this.mrForm.value.meterType,
      reading: this.mrForm.value.reading,
      date: this.mrForm.value.date
    };

    this.api.update(this.selected.id, payload).subscribe({
      next: () => {
        if (this.showList) this.applyFilters();
      },
      error: (err) => console.log(err)
    });
  }

  startDelete(r: any) {
    const ok = confirm(`Biztos törlöd ezt a leolvasást? (${r.meterType})`);
    if (!ok) return;

    this.api.delete(r.id).subscribe({
      next: () => {
        if (this.showList) this.applyFilters();
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
