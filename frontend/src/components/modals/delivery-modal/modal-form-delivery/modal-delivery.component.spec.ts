import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalDeliveryComponent } from './modal-delivery.component';
describe('ModalDeliveryComponent', () => {
  let component: ModalDeliveryComponent;
  let fixture: ComponentFixture<ModalDeliveryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ModalDeliveryComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModalDeliveryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
