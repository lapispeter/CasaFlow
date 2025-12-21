import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ShoppingListService {
  url = 'http://localhost:8000/api/shopping-lists';

  constructor(private http: HttpClient) {}

  getFiltered(filters: {
    titleMode: string;
    titleText: string;
    periodMonths: string;
    boughtMode: string;
    expiryMode: string;
  }) {
    let params = new HttpParams()
      .set('titleMode', filters.titleMode)
      .set('titleText', filters.titleText)
      .set('periodMonths', filters.periodMonths)
      .set('boughtMode', filters.boughtMode)
      .set('expiryMode', filters.expiryMode);

    return this.http.get(this.url, { params });
  }

  create(payload: any) {
    return this.http.post(this.url, payload);
  }

  update(id: number, payload: any) {
    return this.http.put(this.url + '/' + id, payload);
  }

  delete(id: number) {
    return this.http.delete(this.url + '/' + id);
  }
}
