import { Component } from '@angular/core';
import { BillService } from '../../../services/bill-service';
import { DatePipe } from '@angular/common';
import { Form, FormBuilder, ReactiveFormsModule } from '@angular/forms';


@Component({
  selector: 'app-bill',
  imports: [DatePipe, ReactiveFormsModule],
  templateUrl: './bill.html',
  styleUrl: './bill.css',
})
export class Bill {

  bills!: any;
  billForm: any;

  showModal=false;
  addMode=true;

  constructor(private api: BillService,
    private builder: FormBuilder
  ) { }

  ngOnInit() {
    this.getBills();
    this.initForm();
  }

  initForm () {
    this.billForm = this.builder.group({
      billType: [''],
      amount: [''],
      date: [''],
      paymentStatus: ['']
    })


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
  startShowModal () {
    this.showModal=true;
  } 

  cancel () {
    this.showModal=false;
  }

  startSave() {
    console.log('save');
    this.showModal=false;
    if(this.addMode) {
      this.startAddBill();
    } else {
      this.startUpdateBill();
    
    }
  }
  startAddBill () {
    console.log(this.billForm.value);
    const newBill= {
      billType: this.billForm.value.billType,
      amount: this.billForm.value.amount,
      date: this.billForm.value.date,
      paymentStatus: this.billForm.value.paymentStatus
    }
    this.api.createBill(newBill).subscribe({
      next: (res: any) => {
        console.log(res)
        this.getBills();
      },
      error: (err) => {
        console.log(err);
      },
    });
  }
  startUpdateBill () {} 


}

