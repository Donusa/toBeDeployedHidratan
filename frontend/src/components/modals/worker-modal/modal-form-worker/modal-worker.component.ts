import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DeliveryManagementService } from 'src/app/services/delivery-managementService/delivery-management-service';
import { MatSnackBar } from '@angular/material/snack-bar';

const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[.@$!%*?&])[A-Za-z\d.@$!%*?&]{8,}$/;

type ValidationKey = 'minLength' | 'uppercase' | 'lowercase' | 'number' | 'special';

@Component({
  selector: 'app-modal-form-worker',
  templateUrl: './modal-worker.component.html',
  styleUrls: ['./modal-worker.component.css']
})
export class ModalWorkerComponent {
  personForm: FormGroup;
  hidePassword = true;
  passwordValidations: { [key in ValidationKey]: boolean } = {
    minLength: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false
  };
  currentValidation: ValidationKey | null = null;

  constructor(
    private dialogRef: MatDialogRef<ModalWorkerComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private fb: FormBuilder,
    private deliveryService: DeliveryManagementService,
    private snackBar: MatSnackBar
  ) {
    this.personForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [
        Validators.required,
        Validators.pattern(/^[a-z0-9!#$%&'+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'+/=?^_`{|}~-]+)*@[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+$/)
      ]],
      pass: ['', [
        Validators.required,
        Validators.pattern(PASSWORD_PATTERN)
      ]],
      role: ['ROLE_DELIVERY', Validators.required],
      active: [true]
    });
  }

  ngOnInit() {
    this.personForm.get('pass')?.valueChanges.subscribe(value => {
      if (value) {
        this.validatePasswordStepByStep(value);
      }
    });
  }

  validatePasswordStepByStep(password: string) {
    if (password.length < 8) {
      this.currentValidation = 'minLength';
    } else if (!/[A-Z]/.test(password)) {
      this.currentValidation = 'uppercase';
    } else if (!/[a-z]/.test(password)) {
      this.currentValidation = 'lowercase';
    } else if (!/[0-9]/.test(password)) {
      this.currentValidation = 'number';
    } else if (!/[.@$!%*?&]/.test(password)) {
      this.currentValidation = 'special';
    } else {
      this.currentValidation = null;
    }

    this.passwordValidations = {
      minLength: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[.@$!%*?&]/.test(password)
    };
  }

  getValidationMessage(): string {
    const messages: { [key in ValidationKey]: string } = {
      minLength: 'Necesita al menos 8 caracteres',
      uppercase: 'Necesita una letra mayúscula',
      lowercase: 'Necesita una letra minúscula',
      number: 'Necesita un número',
      special: 'Necesita un carácter especial'
    };
    
    return this.currentValidation ? messages[this.currentValidation] : '';
  }

  onSave(): void {
    if (this.personForm.valid) {
      const formData = this.personForm.value;
      
      this.deliveryService.createDeliveryPerson(formData)
        .subscribe({
          next: (response) => {
            this.snackBar.open('Usuario creado exitosamente', 'Cerrar', {
              duration: 3000,
              panelClass: ['success-snackbar']
            });
            this.dialogRef.close({
              action: 'edit',
              person: {
                ...response,
                status: this.mapRoleToStatus(response.role)
              }
            });
          },
          error: (error) => {
            this.snackBar.open(error.message || 'Error al crear el usuario', 'Cerrar', {
              duration: 3000,
              panelClass: ['error-snackbar']
            });
          }
        });
    }
  }

  private mapRoleToStatus(role: string): string {
    switch (role) {
      case 'ROLE_DELIVERY':
        return 'Activo';
      case 'ROLE_ADMIN':
        return 'Administrador';
      default:
        return 'Inactivo';
    }
  }

  onClose(): void {
    this.dialogRef.close();
  }
}
