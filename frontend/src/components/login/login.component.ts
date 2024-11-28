import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthenticationService } from 'src/app/services/authenticationService.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  username: string = '';
  password: string = '';
  error: string = '';
  hidePassword: boolean = true;
  capsLockOn: boolean = false;

  constructor(
    private authService: AuthenticationService,
    private router: Router
  ) {}

  checkCapsLock(event: KeyboardEvent): void {
    this.capsLockOn = event.getModifierState('CapsLock');
  }

  onSubmit() {
    if (!this.username || !this.password) {
      this.error = 'Por favor, complete todos los campos';
      return;
    }

    this.authService.login(this.username.toLowerCase(), this.password).subscribe({
      next: (response) => {
        if (response && response.access_token) {
          this.router.navigate(['/home']);
        } else {
          this.error = 'Error en la respuesta del servidor';
        }
      },
      error: (error) => {
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