import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Client } from '../../../../../interfaces/client.interface';

@Component({
  selector: 'app-edit-client-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule
  ],
  templateUrl: './editClientDialog.component.html',
  styleUrl: './editClientDialog.component.css'
})
export class EditClientDialogComponent {
  clientForm: FormGroup;

  constructor(
    public dialogRef: MatDialogRef<EditClientDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public client: Client,
    private fb: FormBuilder
  ) {
    this.clientForm = this.fb.group({
      address: [client.address, Validators.required],
      phoneNumber: [client.phoneNumber, [Validators.required, Validators.pattern('^[0-9]{10}$')]],
      frecuency: [client.frecuency, [Validators.required, Validators.min(1)]],
      debt: [client.debt, [Validators.required, Validators.min(0)]]
    });
  }

  onSubmit(): void {
    if (this.clientForm.valid) {
      const updatedClient: Client = {
        ...this.client,
        ...this.clientForm.value
      };
      this.dialogRef.close(updatedClient);
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
