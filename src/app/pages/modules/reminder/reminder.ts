import { Component } from '@angular/core';
import { ReminderServicevice } from '../../../services/reminder-service';


@Component({
  selector: 'app-reminder',
  imports: [],
  templateUrl: './reminder.html',
  styleUrl: './reminder.css',
})
export class Reminder {

  reminders: any;

  constructor(private api: ReminderServicevice) { }

  ngOnInit() {
    this.getReminders();
  }

  getReminders() {
    this.api.getReminders().subscribe({
      next: (res) => {
        console.log(res)
        this.reminders = res
      }
    })
  }
  createReminder () {} 
  updateReminder () {}
  deleteReminder () {} 


}
