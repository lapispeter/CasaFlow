import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ReminderServicevice {
  
  url='http://localhost:8000/api/reminders'
  constructor(private http: HttpClient) { }

  getReminders(){
    return this.http.get(this.url)
  }
  createReminder(reminder: any){
    return this.http.post(this.url, reminder)
  }
  updateReminder(reminder: any){
    return this.http.put(this.url +'/'+ reminder.id, reminder)
  }
  deleteReminder(id: number){
    return this.http.delete(this.url +'/'+ id)
  }
}
