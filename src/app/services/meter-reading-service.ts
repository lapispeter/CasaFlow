import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class MeterReadingService {
  
  url='http://localhost:8000/api/meterReadings'
  constructor(private http: HttpClient) { }

  getMeterReadings(){
    return this.http.get(this.url)
  }
  createMeterReading(meterreading: any){
    return this.http.post(this.url, meterreading)
  }
  updateMeterReading(meterreading: any){
    return this.http.put(this.url +'/'+ meterreading.id, meterreading)
  }
  deleteMeterReading(id: number){
    return this.http.delete(this.url +'/'+ id)
  }

}

