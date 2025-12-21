import { Component } from '@angular/core';
import { MeterReadingService } from '../../../services/meter-reading-service';
import { RouterModule } from '@angular/router';


@Component({
  selector: 'app-meter-reading',
  imports: [RouterModule],
  standalone: true,
  templateUrl: './meter-reading.html',
  styleUrl: './meter-reading.css',
})
export class MeterReading {

  meterreadings: any;

  constructor(private api: MeterReadingService) { }

  ngOnInit() {
    this.getMeterReadings();
  }

  getMeterReadings() {
    this.api.getMeterReadings().subscribe({
      next: (res) => {
        console.log(res)
        this.meterreadings = res
      }
    })
  }
  createMeterReading () {} 
  updateMeterReading () {}
  deleteMeterReading () {} 


}
