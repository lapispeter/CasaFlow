import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class MeterReadingService {
  url = 'http://localhost:8000/api/meter-readings';

  constructor(private http: HttpClient) {}

  getFiltered(filters: { meterTypeMode: string; meterTypeText: string; periodMonths: number }) {
    let params = new HttpParams()
      .set('meterTypeMode', filters.meterTypeMode)
      .set('meterTypeText', filters.meterTypeText)
      .set('periodMonths', String(filters.periodMonths));

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
