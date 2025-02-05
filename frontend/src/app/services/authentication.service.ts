import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { BehaviorSubject, map, Observable, catchError } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthenticationResponse } from '../interfaces/authenticationResponse.interface';
import { AuthenticationRequest } from '../interfaces/authenticationRequest.interface';
import { throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { EmailUpdateRequest } from '../interfaces/emailUpdateRequest.interface';
import { ResetPasswordRequest } from '../interfaces/reset-password-request.interface';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthenticationService {
  private currentUserSubject: BehaviorSubject<AuthenticationResponse | null>;
  public currentUser: Observable<AuthenticationResponse | null>;
  private readonly API_URL = environment.apiUrl;

  private apiUrl = `${environment.apiUrl}${environment.endpoints.auth.base}/authenticate`;
  private profileUrl = `${environment.apiUrl}${environment.endpoints.auth.base}`;

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object,
    private router: Router
  ) {
    let initialState = null;

    if (isPlatformBrowser(this.platformId)) {
      const token = sessionStorage.getItem('access_token');
      const role = sessionStorage.getItem('role');
      
      if (token && role) {
        initialState = {
          access_token: token,
          refresh_token: ''
        };
      }
    }
    
    this.currentUserSubject = new BehaviorSubject<AuthenticationResponse | null>(initialState);
    this.currentUser = this.currentUserSubject.asObservable();
  }

  public get currentUserValue(): AuthenticationResponse | null {
    return this.currentUserSubject.value;
  }

  private decodeToken(token: string): any {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      return JSON.parse(window.atob(base64));
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  }

  private getHeaders(): HttpHeaders {
    let headers = new HttpHeaders({
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    });

    if (isPlatformBrowser(this.platformId)) {
        const token = sessionStorage.getItem('access_token');
        if (token) {
            headers = headers.set('Authorization', `Bearer ${token}`);
        }
    }

    return headers;
  }

  private getFromStorage(key: string): string | null {
    return isPlatformBrowser(this.platformId) ? sessionStorage.getItem(key) : null;
  }

  private setToStorage(key: string, value: string): void {
    if (isPlatformBrowser(this.platformId)) {
      sessionStorage.setItem(key, value);
    }
  }

  private removeFromStorage(key: string): void {
    if (isPlatformBrowser(this.platformId)) {
      sessionStorage.removeItem(key);
    }
  }

  login(username: string, password: string): Observable<AuthenticationResponse> {
    const authRequest: AuthenticationRequest = {
      email: username,
      password: password
    };
    
    return this.http.post<AuthenticationResponse>(this.apiUrl, authRequest, {
      headers: this.getHeaders()
    })
    .pipe(
      map(response => {
        if (response && response.access_token) {
          this.setToStorage('access_token', response.access_token);
          const decodedToken = this.decodeToken(response.access_token);
          let role = decodedToken?.role || '';
          role = role.replace('ROLE_', '');
          this.setToStorage('role', role);
          
          const email = decodedToken?.sub || '';
          this.setToStorage('email', email);
          
          this.currentUserSubject.next(response);
          return response;
        }
        return response;
      }),
      catchError(error => {
        if (error.status === 0) {
          return throwError(() => new Error('No se puede conectar al servidor. Por favor, verifique su conexión.'));
        } else if (error.status === 403) {
          return throwError(() => new Error('Acceso denegado. Verifique sus credenciales.'));
        } else if (error.status === 401) {
          return throwError(() => new Error('Usuario o contraseña incorrectos'));
        } else {
          return throwError(() => new Error('Error en el servidor. Por favor, intente nuevamente.'));
        }
      })
    );
  }

  logout(): void {
    this.removeFromStorage('access_token');
    this.removeFromStorage('role');
    this.removeFromStorage('email');
    this.currentUserSubject.next(null);
  }

  isAdmin(): boolean {
    const currentRole = this.getFromStorage('role');
    return currentRole === 'ADMIN';
  }

  isWorker(): boolean {
    const currentRole = this.getFromStorage('role');
    return currentRole === 'WORKER';
  }

  getCurrentRole(): string {
    return this.getFromStorage('role') || '';
  }

  updateEmail(email: string, newEmail: string): Observable<string> {
    const updateRequest: EmailUpdateRequest = {
      email: email,
      newEmail: newEmail
    };
  
    return this.http.put<string>(`${this.profileUrl}/update-email`, updateRequest).pipe(
      map(response => {
        this.setToStorage('email', newEmail);
        return response;
      }),
      catchError(error => {
        if (error.status === 403) {
          return throwError(() => new Error('El correo electrónico ya está en uso. Por favor, elige otro.'));
        } else if (error.status === 401) {
          return throwError(() => new Error('No autorizado'));
        } else {
          return throwError(() => new Error('Error al actualizar el email. Por favor, intente nuevamente.'));
        }
      })
    );
  }

  resetPassword(token: string, newPassword: string): Observable<any> {
    const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[.@$!%*?&])[A-Za-z\d.@$!%*?&]{8,}$/;
  
    if (!PASSWORD_PATTERN.test(newPassword)) {
      return throwError(() => new Error('La contraseña debe contener al menos 8 caracteres, una mayúscula, una minúscula, un número y un carácter especial.'));
    }
  
    const resetRequest: ResetPasswordRequest = { token, newPassword };
    return this.http.post(`${this.profileUrl}/reset-password`, resetRequest, {
      headers: this.getHeaders(),
      responseType: 'text'
    }).pipe(
      map(response => {
        return response; 
      }),
      catchError(error => {
        console.error('Error resetting password:', error);
        return throwError(() => new Error('Error al restablecer la contraseña'));
      })
    );
  }

  updatePassword(email: string, password: string, newPassword: string): Observable<string> {
    const passwordUpdateRequest = {
      email: email,
      password: password,
      newPassword: newPassword
    };

    return this.http.post(`${this.profileUrl}/update-password`, passwordUpdateRequest, {
      headers: this.getHeaders(),
      responseType: 'text'
    }).pipe(
      map(response => {
        return response;
      }),
      catchError(error => {
        console.error('Error updating password:', error);
        if (error.status === 400) {
          return throwError(() => new Error('Solicitud inválida: ' + error.error));
        } else {
          return throwError(() => new Error('Error al actualizar la contraseña: ' + (error.error?.message || error.message)));
        }
      })
    );
  }

  public forgotPassword(request: AuthenticationRequest): Observable<string> {
    return this.http.post(`${this.profileUrl}/forgot-password`, request, {
      headers: this.getHeaders(),
      responseType: 'text'
    }).pipe(
      map(response => {
        return response; 
      }),
      catchError(error => {
        console.error('Error in forgot password:', error);
        return throwError(() => new Error('Error al enviar el correo de restablecimiento de contraseña'));
      })
    );
  }

  public getUserData() {
    const token = this.getFromStorage('access_token');
    if (!token) {
      return null;
    }
    return {
      email: this.getFromStorage('email') || '',
      roles: [this.getFromStorage('role') || '']
    };
  }

  getCurrentEmail(): string {
    return this.getFromStorage('email') || '';
  }
} 