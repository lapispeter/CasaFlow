import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class BillService {
  
  url='http://localhost:8000/bills'
  constructor(private http: HttpClient) { }

  getBills(){
    return this.http.get(this.url)
  }
  createBill(bill: any){
    return this.http.post(this.url, bill)
  }
  updateBill(bill: any){
    return this.http.put(this.url +'/'+ bill.id, bill)
  }
  deleteBill(id: number){
    return this.http.delete(this.url +'/'+ id)
  }
}
