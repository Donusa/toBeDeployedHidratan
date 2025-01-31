import { Component, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { AuthenticationService } from '../../../../services/authentication.service';
import { AuthenticationResponse } from '../../../../interfaces/authenticationResponse.interface';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    RouterLink
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  username: string = '';
  password: string = '';
  error: string = '';
  hidePassword: boolean = true;
  capsLockOn: boolean = false;
  shouldRender: boolean = false;

  constructor(
    private authService: AuthenticationService,
    private router: Router,
    private route: ActivatedRoute,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    if (isPlatformBrowser(this.platformId)) {
      const currentUser = this.authService.currentUserValue;
      if (currentUser) {
        this.router.navigate(['/home']);
      } else {
        this.shouldRender = true;
      }
    }
  }

  checkCapsLock(event: KeyboardEvent): void {
    this.capsLockOn = event.getModifierState('CapsLock');
  }

  onSubmit(): void {
    if (!this.username || !this.password) {
      this.error = 'Por favor, complete todos los campos';
      return;
    }

    this.authService.login(this.username.toLowerCase(), this.password).subscribe({
      next: (response: AuthenticationResponse) => {
        if (response && response.access_token) {
          this.router.navigate(['/home']);
        } else {
          this.error = 'Error en la respuesta del servidor';
        }
      },
      error: (error: { status: number }) => {
        if (error.status === 401) {
          this.error = 'Usuario o contraseña incorrectos';
          this.password = '';
        } else if (error.status === 0) {
          this.error = 'No se puede conectar al servidor. Por favor, verifique su conexión.';
        } else {
          this.error = 'Error durante el inicio de sesión. Por favor, intente nuevamente.';
        }
      }
    });
  }
} 