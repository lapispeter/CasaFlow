import { Component } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ShoppingListService } from '../../../services/shopping-list-service';

@Component({
  selector: 'app-shopping-list',
  imports: [DatePipe, ReactiveFormsModule, RouterLink],
  templateUrl: './shopping-list.html',
  styleUrl: './shopping-list.css',
})
export class ShoppingList {
  items: any[] = [];

  itemForm: any;
  filterForm: any;

  showModal = false;
  addMode = true;
  selected: any = null;

  showList = false;
  showFilterModal = false;

  noResultsMessage = '';

  constructor(
    private api: ShoppingListService,
    private builder: FormBuilder,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.initForms();

    // ✅ Ha Home-ról jövünk → automatikus lista (nincs megvéve)
    this.route.queryParams.subscribe((params: any) => {
      if (params?.fromHome) {
        this.filterForm.patchValue({
          titleMode: 'all',
          titleText: '',
          periodMonths: 'all',
          boughtMode: 'false',
          expiryMode: 'all'
        });

        this.applyFilters();
      }
    });
  }

  initForms() {
    // CRUD
    this.itemForm = this.builder.group({
      title: [''],
      note: [''],
      quantity: [1],
      unit: ['db'],
      purchaseDate: [''],
      expiryDate: [''],
      isBought: [false]
    });

    // Filter
    this.filterForm = this.builder.group({
      titleMode: ['all'],      // all | custom
      titleText: [''],
      periodMonths: ['all'],   // '1'|'3'|'6'|'12'|'all'
      boughtMode: ['all'],     // 'all'|'true'|'false'
      expiryMode: ['all']      // 'all'|onlyWithExpiry|expired|expiringSoon
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
      periodMonths: String(f.periodMonths),
      boughtMode: String(f.boughtMode),
      expiryMode: String(f.expiryMode)
    }).subscribe({
      next: (res: any) => {
        const list = res.data ?? res;
        this.items = Array.isArray(list) ? list : [];

        this.showList = true;
        this.closeFilterModal();

        if (this.items.length === 0) {
          this.noResultsMessage = titleText
            ? `Nincs ilyen nevű tétel: "${titleText}".`
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

    this.itemForm.reset({
      title: '',
      note: '',
      quantity: 1,
      unit: 'db',
      purchaseDate: '',
      expiryDate: '',
      isBought: false
    });

    this.showModal = true;
  }

  startEdit(i: any) {
    this.addMode = false;
    this.selected = i;

    this.itemForm.patchValue({
      title: i.title,
      note: i.note ?? '',
      quantity: i.quantity ?? 1,
      unit: i.unit ?? '',
      purchaseDate: this.toDateInputValue(i.purchaseDate),
      expiryDate: this.toDateInputValue(i.expiryDate),
      isBought: !!i.isBought
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
    const payload = this.cleanPayload(this.itemForm.value);

    this.api.create(payload).subscribe({
      next: () => {
        if (this.showList) this.applyFilters();
      },
      error: (err) => console.log(err)
    });
  }

  startUpdate() {
    if (!this.selected?.id) return;

    const payload = this.cleanPayload(this.itemForm.value);

    this.api.update(this.selected.id, payload).subscribe({
      next: () => {
        if (this.showList) this.applyFilters();
      },
      error: (err) => console.log(err)
    });
  }

  startDelete(i: any) {
    const ok = confirm(`Biztos törlöd ezt a tételt? (${i.title})`);
    if (!ok) return;

    this.api.delete(i.id).subscribe({
      next: () => {
        if (this.showList) this.applyFilters();
      },
      error: (err) => console.log(err)
    });
  }

  private cleanPayload(v: any) {
    const purchaseDate = v.purchaseDate ? v.purchaseDate : null;
    const expiryDate = v.expiryDate ? v.expiryDate : null;

    return {
      title: v.title,
      note: v.note,
      quantity: v.quantity,
      unit: v.unit,
      purchaseDate,
      expiryDate,
      isBought: !!v.isBought
    };
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
