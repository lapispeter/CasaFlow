import { Component } from '@angular/core';
import { BillService } from '../../../services/bill-service';
import { DatePipe } from '@angular/common';


@Component({
  selector: 'app-bill',
  imports: [DatePipe],
  templateUrl: './bill.html',
  styleUrl: './bill.css',
})
export class Bill {

  bills: any;

  showModal=false;
  addmode=true;

  constructor(private api: BillService) { }

  ngOnInit() {
    this.getBills();
  }

  getBills() {
    this.api.getBills().subscribe({
      next: (res: any) => {
        console.log(res)
        this.bills = res.data;
      },
      error: (err) => {
        console.log(err);
      },
    });
  }
  createBill () {
    this.showModal=true;
  } 

  cancelBill () {
    this.showModal=false;
  }

  saveBill () {
    this.showModal=false;
  }

  updateBill () {}
  deleteBill () {} 


}

