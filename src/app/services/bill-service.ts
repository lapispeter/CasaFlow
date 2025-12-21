import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class BillService {
  url = 'http://localhost:8000/api/bills';

  constructor(private http: HttpClient) {}

  getBillsFiltered(filters: { billTypeMode: string; billTypeText: string; periodMonths: number; paymentMode: string }) {
    let params = new HttpParams()
      .set('billTypeMode', filters.billTypeMode)     // all | custom
      .set('billTypeText', filters.billTypeText)     // csak ha custom
      .set('periodMonths', String(filters.periodMonths))
      .set('paymentMode', filters.paymentMode);      // all | Igen | Nem

    return this.http.get(this.url, { params });
  }

  createBill(bill: any) {
    return this.http.post(this.url, bill);
  }

  updateBill(id: number, bill: any) {
    return this.http.put(this.url + '/' + id, bill);
  }

  deleteBill(id: number) {
    return this.http.delete(this.url + '/' + id);
  }
}
