import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalClientDetailComponent } from './modal-client-detail.component';

describe('ModalClientDetailComponent', () => {
  let component: ModalClientDetailComponent;
  let fixture: ComponentFixture<ModalClientDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ModalClientDetailComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModalClientDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
