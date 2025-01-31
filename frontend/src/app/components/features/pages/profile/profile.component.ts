import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { AuthenticationService } from '../../../../services/authentication.service';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatTooltipModule
  ],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  profileForm!: FormGroup;
  securityForm!: FormGroup;
  isLoading = false;
  userEmail: string = '';
  userRole: string = '';
  isActive: boolean = true;
  lastLogin: string = 'Hace 2 días';
  hidePassword = true;
  hideNewPassword = true;
  hideConfirmPassword = true;

  constructor(
    private fb: FormBuilder,
    private authService: AuthenticationService,
    private snackBar: MatSnackBar,
    private router: Router,
    private location: Location,
    private dialog: MatDialog
  ) {
    this.userEmail = this.authService.getCurrentEmail();
    this.userRole = this.authService.getCurrentRole();
    this.initializeForms();
  }

  ngOnInit() {
    if (!this.userEmail || !this.userRole) {
      this.router.navigate(['/login']);
    }
  }

  private initializeForms() {
    this.profileForm = this.fb.group({
      email: [this.userEmail, [
        Validators.required,
        Validators.email
      ]]
    });

    this.securityForm = this.fb.group({
      currentPassword: ['', Validators.required],
      newPassword: ['', [
        Validators.required,
        Validators.minLength(8),
        Validators.pattern(/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/)
      ]],
      confirmPassword: ['', Validators.required]
    }, { validator: this.passwordMatchValidator });
  }

  private passwordMatchValidator(g: FormGroup) {
    return g.get('newPassword')?.value === g.get('confirmPassword')?.value
      ? null : { 'mismatch': true };
  }

  onSubmit() {
    if (this.profileForm.valid && this.hasChanges()) {
      this.isLoading = true;
      const newEmail = this.profileForm.get('email')?.value.toLowerCase();

      this.authService.updateEmail(this.userEmail, newEmail).subscribe({
        next: () => {
          this.snackBar.open('Email actualizado exitosamente', 'Cerrar', {
            duration: 3000,
            panelClass: ['success-snackbar']
          });
          this.authService.logout();
          this.router.navigate(['/login']);
        },
        error: (error) => {
          console.error('Error updating email:', error);
          this.snackBar.open('Error al actualizar el email', 'Cerrar', {
            duration: 3000,
            panelClass: ['error-snackbar']
          });
          this.isLoading = false;
        }
      });
    }
  }

  onChangePassword() {
    if (this.securityForm.valid) {
      this.isLoading = true;
      const currentPassword = this.securityForm.get('currentPassword')?.value;
      const newPassword = this.securityForm.get('newPassword')?.value;

      this.authService.updatePassword(this.userEmail, currentPassword, newPassword).subscribe({
        next: () => {
          this.snackBar.open('Contraseña actualizada exitosamente', 'Cerrar', {
            duration: 3000,
            panelClass: ['success-snackbar']
          });
          this.authService.logout();
          this.router.navigate(['/login']);
        },
        error: (error) => {
          console.error('Error updating password:', error);
          this.snackBar.open('Error al actualizar la contraseña', 'Cerrar', {
            duration: 3000,
            panelClass: ['error-snackbar']
          });
          this.isLoading = false;
        }
      });
    }
  }

  hasChanges(): boolean {
    return this.profileForm.get('email')?.value.toLowerCase() !== this.userEmail;
  }

  getRoleLabel(role: string): string {
    const roleMap: { [key: string]: string } = {
      'ROLE_ADMIN': 'Administrador',
      'ROLE_WORKER': 'Repartidor',
      'ROLE_USER': 'Usuario'
    };
    return roleMap[role] || role;
  }

  goBack(): void {
    this.location.back();
  }
}

