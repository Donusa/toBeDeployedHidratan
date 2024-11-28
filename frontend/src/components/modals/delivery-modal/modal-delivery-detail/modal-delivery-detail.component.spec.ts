import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalDeliveryDetailComponent } from './modal-delivery-detail.component';

describe('ModalDeliveryDetailComponent', () => {
  let component: ModalDeliveryDetailComponent;
  let fixture: ComponentFixture<ModalDeliveryDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ModalDeliveryDetailComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModalDeliveryDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
