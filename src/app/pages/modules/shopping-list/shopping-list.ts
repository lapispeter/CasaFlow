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

  successMessage = '';
  errorMessage = '';
  isSaving = false;

  items: any[] = [];

  itemForm: any;
  filterForm: any;

  showModal = false;
  addMode = true;
  selected: any = null;

  showList = false;
  showFilterModal = false;

  noResultsMessage = '';

  // ✅ globális keresőből érkező "kiemelendő" találat
  focusId: number | null = null;

  // ✅ globális keresőből érkező q (külön tároljuk, mert NEM a backend "custom" szűrését használjuk)
  searchQ = '';

  constructor(
    private api: ShoppingListService,
    private builder: FormBuilder,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.initForms();

    this.route.queryParams.subscribe((params: any) => {
      const q = String(params?.q ?? '').trim();
      const focusIdRaw = params?.focusId;

      this.focusId = focusIdRaw != null ? Number(focusIdRaw) : null;
      this.searchQ = q;

      // ✅ Ha keresőből jövünk:
      // Nem "custom"-ot használunk, hanem "all"-t, és mi szűrünk a frontendben.
      if (q) {
        this.filterForm.patchValue({
          titleMode: 'all',
          titleText: '',
          periodMonths: 'all',
          boughtMode: 'all',
          expiryMode: 'all'
        });

        this.applyFilters();
        return;
      }

      // ✅ Ha Home-ról jövünk
      if (params?.fromHome) {
        this.searchQ = '';
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
    this.itemForm = this.builder.group({
      title: [''],
      note: [''],
      quantity: [1],
      unit: ['db'],
      purchaseDate: [''],
      expiryDate: [''],
      isBought: [false]
    });

    this.filterForm = this.builder.group({
      titleMode: ['all'],
      titleText: [''],
      periodMonths: ['all'],
      boughtMode: ['all'],
      expiryMode: ['all']
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

    // innen kezdve: backend "all", plusz a saját keresés (ha van searchQ)
    this.api.getFiltered({
      titleMode: String(f.titleMode),
      titleText: String(f.titleText ?? ''),
      periodMonths: String(f.periodMonths),
      boughtMode: String(f.boughtMode),
      expiryMode: String(f.expiryMode)
    }).subscribe({
      next: (res: any) => {
        const list = res.data ?? res;
        const allItems = Array.isArray(list) ? list : [];

        // ✅ frontend keresés: kis/nagybetű, ékezet, contains
        if (this.searchQ) {
          const needleParts = this.normalizeText(this.searchQ).split(/\s+/).filter(Boolean);

          this.items = allItems.filter((x: any) => {
            const hay = this.normalizeText(`${x?.title ?? ''} ${x?.note ?? ''} ${x?.unit ?? ''} ${x?.quantity ?? ''}`);
            return needleParts.every(p => hay.includes(p));
          });

          this.showList = true;
          this.closeFilterModal();

          if (this.items.length === 0) {
            this.noResultsMessage = `Nincs találat erre: "${this.searchQ}".`;
          } else {
            this.noResultsMessage = '';
          }

          return;
        }

        // ✅ ha nincs globális q, akkor simán a backend szűrés eredménye
        this.items = allItems;

        this.showList = true;
        this.closeFilterModal();

        if (this.items.length === 0) {
          this.noResultsMessage = 'Nincs találat a megadott szűrésre.';
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
    if (this.isSaving) return;

    this.showModal = false;

    if (this.addMode) this.startAdd();
    else this.startUpdate();
  }

  startAdd() {
    if (this.isSaving) return;
    this.isSaving = true;

    const payload = this.cleanPayload(this.itemForm.value);

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

    const payload = this.cleanPayload(this.itemForm.value);

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

  startDelete(i: any) {
    const ok = confirm(`Biztos törlöd ezt a tételt? (${i.title})`);
    if (!ok) return;

    this.api.delete(i.id).subscribe({
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

  private normalizeText(s: string): string {
    return String(s ?? '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }
}