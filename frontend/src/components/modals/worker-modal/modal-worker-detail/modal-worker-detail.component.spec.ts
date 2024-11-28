import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalWorkerDetailComponent } from './modal-worker-detail.component';

describe('ModalUserDetailComponent', () => {
  let component: ModalWorkerDetailComponent;
  let fixture: ComponentFixture<ModalWorkerDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ModalWorkerDetailComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModalWorkerDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
