import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router, RouterLink } from '@angular/router';
import { AuthenticationService } from '../../../../services/authentication.service';
import { AuthenticationRequest } from '../../../../interfaces/authenticationRequest.interface';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    RouterLink
  ],
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.css']
})
export class ForgotPasswordComponent {
  forgotPasswordForm: FormGroup;
  tokenForm: FormGroup;
  successMessage: string = '';
  errorMessage: string = '';
  showTokenForm: boolean = false;
  isSubmitting: boolean = false;
  hidePassword: boolean = true;

  constructor(
    private fb: FormBuilder,
    private authService: AuthenticationService,
    private snackBar: MatSnackBar,
    private router: Router
  ) {
    this.forgotPasswordForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });

    this.tokenForm = this.fb.group({
      token: ['', [Validators.required]],
      newPassword: ['', [
        Validators.required,
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&.])[A-Za-z\d@$!%*?&.]{8,}$/)
      ]]
    });
  }

  onSubmit() {
    if (this.forgotPasswordForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;
      const email = this.forgotPasswordForm.get('email')?.value;
      const request: AuthenticationRequest = { email: email, password: '' };

      this.authService.forgotPassword(request).subscribe({
        next: () => {
          this.successMessage = 'Instrucciones de recuperación enviadas a tu correo.';
          this.errorMessage = '';
          this.showTokenForm = true;
          this.isSubmitting = false;
        },
        error: (error) => {
          this.errorMessage = 'Error al enviar las instrucciones. Por favor, intente nuevamente.';
          this.successMessage = '';
          this.isSubmitting = false;
        }
      });
    }
  }

  onTokenSubmit() {
    if (this.tokenForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;
      const token = this.tokenForm.get('token')?.value;
      const newPassword = this.tokenForm.get('newPassword')?.value;

      this.authService.resetPassword(token, newPassword).subscribe({
        next: () => {
          this.snackBar.open('Contraseña restablecida con éxito. Por favor, inicia sesión.', 'Cerrar', {
            duration: 3000,
            panelClass: ['success-snackbar']
          });
          this.router.navigate(['/login']);
        },
        error: (error) => {
          this.errorMessage = 'Error al restablecer la contraseña. Por favor, verifique el token e intente nuevamente.';
          this.successMessage = '';
          this.isSubmitting = false;
        }
      });
    }
  }
} 