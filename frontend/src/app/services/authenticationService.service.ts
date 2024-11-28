import { Injectable } from '@angular/core';
import { BehaviorSubject, map, Observable, catchError, of } from 'rxjs';
import { HttpClient, HttpParams } from '@angular/common/http';
import { authenticationResponse } from 'src/interfaces/authenticationResponse.interface';
import { HttpHeaders } from '@angular/common/http';
import { authenticationRequest } from 'src/interfaces/authenticationRequest.interface';
import { throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { emailUpdateRequest } from 'src/interfaces/emailUpdateRequest.interface';
import { resetPasswordRequest } from 'src/interfaces/resetPasswordRequest.interface';
@Injectable({
  providedIn: 'root'
})
export class AuthenticationService {
  private currentUserSubject: BehaviorSubject<authenticationResponse | null>;
  public currentUser: Observable<authenticationResponse | null>;

  private apiUrl = `${environment.apiUrl}${environment.endpoints.auth.base}/authenticate`;
  private profileUrl = `${environment.apiUrl}${environment.endpoints.auth.base}`;


  constructor(private http: HttpClient) {
    
    const token = localStorage.getItem('access_token');
    const role = localStorage.getItem('role');
    
    if (token && role) {
      const userData: authenticationResponse = {
        email: localStorage.getItem('email') || '',
        role: role,
        access_token: token,
        refresh_token: ''
      };
      this.currentUserSubject = new BehaviorSubject<authenticationResponse | null>(userData);
    } else {
      this.currentUserSubject = new BehaviorSubject<authenticationResponse | null>(null);
    }
    this.currentUser = this.currentUserSubject.asObservable();
  }

  public get currentUserValue(): authenticationResponse | null {
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
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });
  }

  login(username: string, password: string): Observable<authenticationResponse> {
    const authRequest: authenticationRequest = {
      email: username,
      password: password
    };
    
    return this.http.post<authenticationResponse>(this.apiUrl, authRequest, {
      headers: this.getHeaders()
    })
    .pipe(
      map(response => {
        if (response && response.access_token) {
          
          localStorage.setItem('access_token', response.access_token);
          
          const decodedToken = this.decodeToken(response.access_token);
          const role = decodedToken?.role || decodedToken?.roles || [];
          const email = decodedToken?.sub || '';
          
          localStorage.setItem('role', Array.isArray(role) ? role[0] : role);
          localStorage.setItem('email', email);
          
          const userData: authenticationResponse = {
            email: email,
            role: Array.isArray(role) ? role[0] : role,
            access_token: response.access_token,
            refresh_token: response.refresh_token || ''
          };
          this.currentUserSubject.next(userData);
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
    localStorage.removeItem('access_token');
    localStorage.removeItem('role');
    localStorage.removeItem('email');
    this.currentUserSubject.next(null);
  }

  isAdmin(): boolean {
    const currentRole = localStorage.getItem('role');
    return currentRole?.toLowerCase() === 'admin' || currentRole === 'ROLE_ADMIN';
  }

  isWorker(): boolean {
    const currentRole = localStorage.getItem('role');
    return currentRole?.toLowerCase() === 'worker' || currentRole === 'ROLE_DELIVERY';
  }

  getCurrentRole(): string {
    return localStorage.getItem('role') || '';
  }

  updateEmail(email: string, newEmail: string): Observable<string> {
    const updateRequest: emailUpdateRequest = {
      email: email,
      newEmail: newEmail
    };
  
    return this.http.post(`${this.profileUrl}/update-email`, updateRequest, {
      headers: this.getHeaders(),
      responseType: 'text' as 'json'
    }).pipe(
      map((response: any) => {
        localStorage.setItem('email', newEmail);
        const currentUser = this.currentUserSubject.value;
        if (currentUser) {
          currentUser.email = newEmail;
          this.currentUserSubject.next(currentUser);
        }
        return response as string;
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
  
    const resetRequest: resetPasswordRequest = { token, newPassword };
    return this.http.post(`${this.profileUrl}/reset-password`, resetRequest, {
      headers: this.getHeaders(),
      responseType: 'text'
    }).pipe(
      map(response => {
        return response; 
      }),
      catchError(error => {
        console.error('Error resetting password:', error);
        return throwError(() => new Error('Error al restablecer la contraseña '));
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


  public forgotPassword(request: authenticationRequest): Observable<string> {
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
}