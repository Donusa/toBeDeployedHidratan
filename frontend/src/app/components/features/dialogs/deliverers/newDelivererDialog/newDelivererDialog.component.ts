import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { DelivererService } from '../../../../../services/delivererService/deliverer.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-new-deliverer-dialog',
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
  templateUrl: './newDelivererDialog.component.html',
  styleUrl: './newDelivererDialog.component.css'
})
export class NewDelivererDialogComponent {
  delivererForm: FormGroup;
  roles = [
    { value: 'ROLE_DELIVERY', label: 'Repartidor' },
    { value: 'ROLE_ADMIN', label: 'Administrador' }
  ];

  constructor(
    private dialogRef: MatDialogRef<NewDelivererDialogComponent>,
    private formBuilder: FormBuilder,
    private delivererService: DelivererService,
    private snackBar: MatSnackBar
  ) {
    this.delivererForm = this.formBuilder.group({
      name: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [
        Validators.required,
        Validators.minLength(8),
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[.@$!%*?&])[A-Za-z\d.@$!%*?&]{8,}$/)
      ]],
      role: ['ROLE_DELIVERY', [Validators.required]]
    });
  }

  onSubmit(): void {
    if (this.delivererForm.valid) {
      const formValue = this.delivererForm.value;
      const delivererData = {
        ...formValue,
        email: formValue.email.toLowerCase()
      };
      
      this.delivererService.createDeliverer(delivererData).subscribe({
        next: () => {
          this.snackBar.open('Usuario creado exitosamente', 'Cerrar', {
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'top'
          });
          this.dialogRef.close(true);
        },
        error: (error) => {
          console.error('Error creating user:', error);
          this.snackBar.open(error.message || 'Error al crear el usuario', 'Cerrar', {
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'top'
          });
        }
      });
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
} 