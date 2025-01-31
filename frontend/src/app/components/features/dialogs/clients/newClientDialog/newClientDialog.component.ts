import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule } from '@angular/material/dialog';

@Component({
  selector: 'app-new-client-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
    MatDialogModule
  ],
  templateUrl: './newClientDialog.component.html',
  styleUrl: './newClientDialog.component.css'
})
export class NewClientDialogComponent {
  clientForm: FormGroup;

  constructor(
    private dialogRef: MatDialogRef<NewClientDialogComponent>,
    private fb: FormBuilder
  ) {
    this.clientForm = this.fb.group({
      address: ['', Validators.required],
      phoneNumber: ['', [Validators.required, Validators.pattern('^[0-9]{10}$')]],
      frecuency: [0, [Validators.required, Validators.min(1)]],
      debt: [0, [Validators.required, Validators.min(0)]]
    });
  }

  onSubmit(): void {
    if (this.clientForm.valid) {
      this.dialogRef.close(this.clientForm.value);
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
