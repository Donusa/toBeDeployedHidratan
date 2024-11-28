import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Location } from '@angular/common';
import { AuthenticationService } from 'src/app/services/authenticationService.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTabGroup } from '@angular/material/tabs';
import { MatDialog } from '@angular/material/dialog';
import { LogoutConfirmationDialogComponent } from '../logout-confirmation-dialog/logout-confirmation-dialog.component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  @ViewChild(MatTabGroup) tabGroup!: MatTabGroup;
  profileForm!: FormGroup;
  securityForm!: FormGroup;
  hidePassword = true;
  saving = false;
  changingPassword = false;
  username: string = 'Usuario Demo';
  userRole: string = 'Administrador';
  isActive: boolean = true;
  userEmail: string = '';

  constructor(
    private fb: FormBuilder,
    private location: Location,
    private authService: AuthenticationService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private router: Router
  ) {
    this.userEmail = localStorage.getItem('email') || '';
  }

  ngOnInit() {
    this.initializeForms();
  }

  private initializeForms() {
    this.profileForm = this.fb.group({
      email: [this.userEmail, [
        Validators.required,
        Validators.pattern(/^[a-z0-9!#$%&'+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'+/=?^_`{|}~-]+)*@[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+$/)
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
    if (this.profileForm.valid) {
      this.saving = true;
      const newEmail = this.profileForm.get('email')?.value.toLowerCase();
      const currentEmail = this.userEmail;

      this.authService.updateEmail(currentEmail, newEmail).subscribe({
        next: () => {
          this.userEmail = newEmail;
          this.saving = false;

          const dialogRef = this.dialog.open(LogoutConfirmationDialogComponent);

          dialogRef.afterClosed().subscribe(result => {
            if (result) {
              this.authService.logout();
              this.router.navigate(['/login']);
            }
          });
        },
        error: (error) => {
          this.saving = false;
          this.snackBar.open('Error al actualizar el correo electrónico. Por favor, intente nuevamente.', 'Cerrar', {
            duration: 3000,
            panelClass: ['error-snackbar']
          });
          this.profileForm.patchValue({
            email: this.userEmail
          });
        }
      });
    }
  }

  onChangePassword() {
    if (this.securityForm.valid) {
      this.changingPassword = true;
      const currentPassword = this.securityForm.get('currentPassword')?.value;
      const newPassword = this.securityForm.get('newPassword')?.value;

      this.authService.updatePassword(this.userEmail, currentPassword, newPassword).subscribe({
        next: (response) => {
          this.changingPassword = false;
          this.securityForm.reset();

          
    
          const dialogRef = this.dialog.open(LogoutConfirmationDialogComponent);

          dialogRef.afterClosed().subscribe(result => {
            if (result) {
              this.authService.logout();
              this.router.navigate(['/login']);
            }
          });
        },
        error: (error) => {
          this.changingPassword = false;
          this.snackBar.open('Error al cambiar la contraseña. Por favor, intente nuevamente.', 'Cerrar', {
            duration: 3000,
            panelClass: ['error-snackbar']
          });
        }
      });
    }
  }

  goBack(): void {
    this.location.back();
  }

  resetForm(): void {
    this.profileForm.reset({
      username: 'Usuario Demo',
      email: this.userEmail
    });
  }

  resetSecurityForm(): void {
    this.securityForm.reset();
  }

  onTabChange(event: any) {
    const tabIndex = event.index;
    const tabContent = document.querySelectorAll('.tab-content')[tabIndex];

    if (tabContent) {
      const offsetTop = tabContent.getBoundingClientRect().top + window.scrollY - document.querySelector('.profile-header')!.clientHeight;
      window.scrollTo({
        top: offsetTop,
        behavior: 'smooth'
      });
    }
  }
}
