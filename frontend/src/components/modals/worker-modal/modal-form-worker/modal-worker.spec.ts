import { ComponentFixture, TestBed } from '@angular/core/testing';

import {ModalWorkerComponent} from './modal-worker.component';

describe('ModalWorkerComponent', () => {
  let component: ModalWorkerComponent;
  let fixture: ComponentFixture<ModalWorkerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ModalWorkerComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModalWorkerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
