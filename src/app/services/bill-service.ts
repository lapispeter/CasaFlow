import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class BillService {
  url = 'http://localhost:8000/api/bills';

  constructor(private http: HttpClient) {}

  getBillsFiltered(filters: { billTypeMode: string; billTypeText: string; periodMonths: string; paymentMode: string }) {
    let params = new HttpParams()
      .set('billTypeMode', filters.billTypeMode)
      .set('billTypeText', filters.billTypeText)
      .set('periodMonths', filters.periodMonths)   // ✅ '1'|'3'|'6'|'12'|'all'
      .set('paymentMode', filters.paymentMode);

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
