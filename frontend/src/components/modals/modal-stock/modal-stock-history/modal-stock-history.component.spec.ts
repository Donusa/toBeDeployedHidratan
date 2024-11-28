import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalStockHistoryComponent } from './modal-stock-history.component';

describe('ModalStockHistoryComponent', () => {
  let component: ModalStockHistoryComponent;
  let fixture: ComponentFixture<ModalStockHistoryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ModalStockHistoryComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModalStockHistoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
