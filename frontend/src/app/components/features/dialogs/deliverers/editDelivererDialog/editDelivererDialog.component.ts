import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { DelivererService } from '../../../../../services/delivererService/deliverer.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Deliverer } from '../../../../../interfaces/deliverer.interface';

@Component({
  selector: 'app-edit-deliverer-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    ReactiveFormsModule
  ],
  templateUrl: './editDelivererDialog.component.html',
  styleUrl: './editDelivererDialog.component.css'
})
export class EditDelivererDialogComponent {
  delivererForm: FormGroup;

  constructor(
    private dialogRef: MatDialogRef<EditDelivererDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Deliverer,
    private formBuilder: FormBuilder,
    private delivererService: DelivererService,
    private snackBar: MatSnackBar
  ) {
    this.delivererForm = this.formBuilder.group({
      name: [data.name, [Validators.required]],
      email: [data.email, [Validators.required, Validators.email]],
      active: [data.active],
      role: [data.role]
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSubmit(): void {
    if (this.delivererForm.valid) {
      const updatedDeliverer = {
        ...this.delivererForm.value,
        products: this.data.products
      };

      this.delivererService.updateDeliverer(this.data.email, updatedDeliverer).subscribe({
        next: () => {
          this.snackBar.open('Repartidor actualizado exitosamente', 'Cerrar', {
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'top'
          });
          this.dialogRef.close(true);
        },
        error: (error) => {
          console.error('Error updating deliverer:', error);
          this.snackBar.open('Error al actualizar el repartidor', 'Cerrar', {
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'top'
          });
        }
      });
    }
  }
} 