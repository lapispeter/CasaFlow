import { Component } from '@angular/core';
import { BillService } from '../../../services/bill-service';


@Component({
  selector: 'app-bill',
  imports: [],
  templateUrl: './bill.html',
  styleUrl: './bill.css',
})
export class Bill {

  bills: any;

  constructor(private api: BillService) { }

  ngOnInit() {
    this.getBills();
  }

  getBills() {
    this.api.getBills().subscribe({
      next: (res) => {
        console.log(res)
        this.bills = res
      }
    })
  }
  createBill () {} 
  updateBill () {}
  deleteBill () {} 


}

