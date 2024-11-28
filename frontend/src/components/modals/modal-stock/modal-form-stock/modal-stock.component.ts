import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { AuthenticationService } from 'src/app/services/authenticationService.service';

@Component({
  selector: 'app-modal-stock',
  templateUrl: './modal-stock.component.html',
  styleUrls: ['./modal-stock.component.css']
})
export class ModalStockComponent implements OnInit {
  stockForm: FormGroup = this.fb.group({
    id: [{value: this.data?.id || null, disabled: true}],
    name: ['', Validators.required],
    stock: [0, [Validators.required, Validators.min(0)]],
    price: [0, [Validators.required, Validators.min(0)]]
  });
  isAdmin: boolean = false;
  isEditMode: boolean = false;

  constructor(
    private dialogRef: MatDialogRef<ModalStockComponent>,
    private fb: FormBuilder,
    private authService: AuthenticationService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.isAdmin = this.authService.isAdmin();
    this.isEditMode = !!data;
  }

  ngOnInit() {
    if (this.data) {
      this.stockForm.patchValue(this.data);
    }
  }

  onClose(): void {
    this.dialogRef.close();
  }

  onSubmit(): void {
    if (this.stockForm.valid) {
      const formValue = {...this.stockForm.getRawValue()};
      this.dialogRef.close(formValue);
    }
  }
}
