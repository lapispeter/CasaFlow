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

  // globális keresőből érkező "kiemelendő" találat
  focusId: number | null = null;

  // globális keresőből érkező q
  searchQ = '';

  // HOME-ról jövő speciális eset:
  // 1 hónapos lista + dátum nélküli elemek is jelenjenek meg
  includeNoDateItemsFromHome = false;

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
      this.includeNoDateItemsFromHome = false;

      // ===== GLOBÁLIS KERESŐ =====
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

      // ===== HOME NAVIGÁCIÓ =====
      if (params?.fromHome) {
        const titleMode = String(params?.titleMode ?? 'all');
        const titleText = String(params?.titleText ?? '');
        const periodMonths = String(params?.periodMonths ?? '1');
        const boughtMode = String(params?.boughtMode ?? 'all');
        const expiryMode = String(params?.expiryMode ?? 'all');

        this.searchQ = '';

        // Bevásárló lista csempe: elmúlt 1 hónap + dátum nélküli elemek is
        if (
          titleMode === 'all' &&
          titleText === '' &&
          periodMonths === '1' &&
          boughtMode === 'all' &&
          expiryMode === 'all'
        ) {
          this.includeNoDateItemsFromHome = true;
        }

        this.filterForm.patchValue({
          titleMode,
          titleText,
          periodMonths,
          boughtMode,
          expiryMode
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

    // Ha Home-ról jöttünk az 1 hónapos bevásárló lista csempéről,
    // akkor backendből az összeset kérjük le, és frontendben szűrjük:
    // - elmúlt 1 hónap
    // - vagy nincs dátuma
    const apiPeriodMonths = this.includeNoDateItemsFromHome
      ? 'all'
      : String(f.periodMonths);

    this.api.getFiltered({
      titleMode: String(f.titleMode),
      titleText: String(f.titleText ?? ''),
      periodMonths: apiPeriodMonths,
      boughtMode: String(f.boughtMode),
      expiryMode: String(f.expiryMode)
    }).subscribe({
      next: (res: any) => {
        const list = res.data ?? res;
        let allItems = Array.isArray(list) ? list : [];

        // HOME speciális szűrés:
        // elmúlt 1 hónap + dátum nélküli tételek
        if (this.includeNoDateItemsFromHome) {
          allItems = allItems.filter((x: any) => this.isWithinLastMonthOrNoDate(x?.purchaseDate));
        }

        // frontend keresés globális q esetén
        if (this.searchQ) {
          const needleParts = this.normalizeText(this.searchQ).split(/\s+/).filter(Boolean);

          this.items = allItems.filter((x: any) => {
            const hay = this.normalizeText(
              `${x?.title ?? ''} ${x?.note ?? ''} ${x?.unit ?? ''} ${x?.quantity ?? ''}`
            );
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

  markAsBought(i: any) {
    if (!i?.id) return;
    if (this.isSaving) return;

    this.isSaving = true;

    const payload = {
      title: i.title,
      note: i.note ?? '',
      quantity: i.quantity ?? 1,
      unit: i.unit ?? 'db',
      purchaseDate: this.toDateInputValue(i.purchaseDate) || null,
      expiryDate: this.toDateInputValue(i.expiryDate) || null,
      isBought: true
    };

    this.api.update(i.id, payload).subscribe({
      next: () => {
        this.showSuccess('A tétel teljesítettként lett jelölve ✅');
        if (this.showList) this.applyFilters();
        this.isSaving = false;
      },
      error: (err) => {
        console.log(err);
        this.showError('Hiba történt a frissítésnél.');
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