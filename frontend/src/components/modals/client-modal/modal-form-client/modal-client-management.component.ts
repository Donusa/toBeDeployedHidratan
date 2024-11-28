import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormGroup,Validators } from '@angular/forms';

@Component({
  selector: 'app-modal-client-management',
  templateUrl: './modal-client-management.component.html',
  styleUrls: ['./modal-client-management.component.css']
})
export class ModalClientManagementComponent implements OnInit {
  clientForm: FormGroup;
  originalValues: any;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<ModalClientManagementComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.clientForm = this.fb.group({
      id: [this.data?.id || null],
      name: [{ value: this.data?.name || '', disabled: false }, Validators.required],
      address: [{ value: this.data?.address || '', disabled: false }, Validators.required],
      debt: [{ value: this.data?.debt || 0, disabled: false }, Validators.required],
      frecuency: [{ value: this.data?.frecuency || 7, disabled: false }, Validators.required]
    });

    this.originalValues = { ...this.data };
  }

  ngOnInit(): void {}

  onSubmit(): void {
    if (this.clientForm.valid) {
      const formValue = this.clientForm.getRawValue();
      const updateData = {
        ...this.originalValues,
        id: formValue.id,
        name: formValue.name !== undefined ? formValue.name : this.originalValues.name,
        address: formValue.address !== undefined ? formValue.address : this.originalValues.address,
        debt: formValue.debt !== undefined ? formValue.debt : this.originalValues.debt,
        frecuency: formValue.frecuency !== undefined ? formValue.frecuency : this.originalValues.frecuency,
        clientProducts: this.originalValues.clientProducts || []
      };

      this.dialogRef.close(updateData);
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}