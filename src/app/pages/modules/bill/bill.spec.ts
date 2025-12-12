import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Bill } from './bill';

describe('Bill', () => {
  let component: Bill;
  let fixture: ComponentFixture<Bill>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Bill]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Bill);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
