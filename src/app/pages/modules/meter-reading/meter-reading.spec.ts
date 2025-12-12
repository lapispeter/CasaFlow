import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MeterReading } from './meter-reading';

describe('MeterReading', () => {
  let component: MeterReading;
  let fixture: ComponentFixture<MeterReading>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MeterReading]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MeterReading);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
