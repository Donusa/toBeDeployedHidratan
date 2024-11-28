import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalUserManagementComponent} from './modal-client-management.component'

describe('ModalUserManagementComponent', () => {
  let component: ModalUserManagementComponent;
  let fixture: ComponentFixture<ModalUserManagementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ModalUserManagementComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModalUserManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
