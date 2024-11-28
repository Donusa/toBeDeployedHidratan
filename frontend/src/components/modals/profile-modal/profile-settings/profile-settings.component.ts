import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-profile-settings',
  templateUrl: './profile-settings.component.html',
  styleUrls: ['./profile-settings.component.css']
})
export class ProfileSettingsComponent {
  profileForm: FormGroup;
  hidePassword = true;
  authService: any;

  constructor(
    private dialogRef: MatDialogRef<ProfileSettingsComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private fb: FormBuilder
  ) {
    this.profileForm = this.fb.group({
      username: [data.username, Validators.required],
      currentPassword: ['', Validators.required],
      newPassword: [''],
      confirmPassword: ['']
    });
  }

  onSubmit() {
    if (this.profileForm.valid) {
      interface UpdateEmailResponse {
        // Define the structure of the response if known
      }

      interface UpdateEmailError {
        status: number;
        // Define other properties of the error if known
      }

      this.authService.updateEmail(this.profileForm.value.email as string, this.profileForm.value.newEmail as string).subscribe({
        next: (response: UpdateEmailResponse) => {
          // Manejar la respuesta exitosa
          console.log('Email actualizado exitosamente');
        },
        error: (error: UpdateEmailError) => {
          if (error.status === 403) {
            alert('El correo electrónico ya está en uso. Por favor, elige otro.');
          } else if (error.status === 401) {
            alert('No autorizado');
          } else {
            alert('Error al actualizar el email. Por favor, intente nuevamente.');
          }
        }
      });
    }
  }

  onCancel() {
    this.dialogRef.close();
  }
}
