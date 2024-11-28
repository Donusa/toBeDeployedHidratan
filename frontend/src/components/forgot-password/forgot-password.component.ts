import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthenticationService } from 'src/app/services/authenticationService.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { authenticationRequest } from 'src/interfaces/authenticationRequest.interface';
import { Router } from '@angular/router';

@Component({
  selector: 'app-forgot-password',
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
      const request: authenticationRequest = { email: email, password: 'null' };
      this.authService.forgotPassword(request).subscribe({
        next: () => {
          this.successMessage = 'Instrucciones de recuperación enviadas a tu correo.';
          this.errorMessage = '';
          this.showTokenForm = true;
          this.isSubmitting = false;
        },
        error: (error) => {
          this.errorMessage = error.message;
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
        next: (response) => {
          this.successMessage = response;
          this.errorMessage = '';
          this.isSubmitting = false;
          this.snackBar.open('Contraseña restablecida con éxito. Por favor, inicia sesión.', 'Cerrar', {
            duration: 3000,
            panelClass: ['success-snackbar']
          });
          this.router.navigate(['/login']);
        },
        error: (error) => {
          this.errorMessage = error.message;
          this.successMessage = '';
          this.isSubmitting = false;
        }
      });
    }
  }

  redirectToLogin() {
    localStorage.removeItem('access_token');
    this.router.navigate(['/login']);
  }
}