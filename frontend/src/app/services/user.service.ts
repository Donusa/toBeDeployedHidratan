import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { AppUserResponse } from '../interfaces/appUserResponse.interface';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private usersUrl = `${environment.apiUrl}${environment.endpoints.management.base}`;

  constructor(private http: HttpClient) { }

  private getHeaders(): HttpHeaders {
    const token = sessionStorage.getItem('access_token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  findAll(): Observable<AppUserResponse[]> {
    return this.http.get<AppUserResponse[]>(`${this.usersUrl}/users`, {
      headers: this.getHeaders()
    })
    .pipe(
      catchError(error => {
        console.error('Error fetching users:', error);
        if (error.status === 401) {
          return throwError(() => new Error('No autorizado. Por favor, inicie sesión nuevamente.'));
        } else if (error.status === 403) {
          return throwError(() => new Error('No tiene permisos para realizar esta acción.'));
        }
        return throwError(() => new Error('Error al obtener los usuarios'));
      })
    );
  }
} 