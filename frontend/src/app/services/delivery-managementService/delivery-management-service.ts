import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { DeliveryPerson } from 'src/interfaces/delivery-person.interface';
import { HttpHeaders } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { environment } from 'src/environments/environment'
import { AppUserResponse } from 'src/interfaces/appUserResponse.interface';

interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  role: string;
}

interface AuthenticationResponse {
  access_token: string;
  refresh_token: string;
}

@Injectable({
  providedIn: 'root'
})
export class DeliveryManagementService {
  private authUrl = `${environment.apiUrl}${environment.endpoints.auth.base}`;
  private usersUrl = `${environment.apiUrl}${environment.endpoints.management.base}`;

  constructor(private http: HttpClient) { }

  createDeliveryPerson(person: Partial<DeliveryPerson>): Observable<any> {
    const registerRequest: RegisterRequest = {
      name: person.name || '',
      email: person.email || '',
      password: (person as any).pass || '',
      role: person.role || 'ROLE_DELIVERY'
    };

    return this.http.post<AuthenticationResponse>(`${this.authUrl}/register`, registerRequest)
      .pipe(
        map(response => ({
          name: person.name,
          email: person.email,
          role: person.role,
          active: true
        })),
        catchError(error => {
          console.error('Error creating delivery person:', error);
          if (error.status === 409) {
            return throwError(() => new Error('El email ya existe'));
          } else if (error.status === 400) {
            return throwError(() => new Error(error.error));
          }
          return throwError(() => new Error('Error al crear el repartidor'));
        })
      );
  }

  getDeliveryPersons(): Observable<DeliveryPerson[]> {
    return this.http.get<DeliveryPerson[]>(`${this.usersUrl}/users`)
      .pipe(
        map(users => users
          .filter(user => user.role === 'ROLE_DELIVERY' || user.role === 'ROLE_ADMIN')
          .map(user => ({
            name: user.name,
            email: user.email,
            role: user.role,
            active: user.active ?? true
          }))),
        catchError(error => {
          console.error('Error fetching delivery persons:', error);
          return throwError(() => new Error('Error al obtener los repartidores'));
        })
      );
  }

  getDeliveryPerson(email: string): Observable<DeliveryPerson> {
    return this.http.get<DeliveryPerson>(`${this.usersUrl}/${email}`)
      .pipe(
        catchError(error => {
          console.error('Error fetching delivery person:', error);
          return throwError(() => new Error('Error al obtener el repartidor'));
        })
      );
  }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('access_token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  updateDeliveryPerson(person: DeliveryPerson, originalEmail: string): Observable<DeliveryPerson> {
    const updateData = {
      email: person.email,
      name: person.name,
      role: 'ROLE_DELIVERY',
      active: person.active,
    };


    return this.http.put<AppUserResponse>(
      `${this.usersUrl}/users?email=${originalEmail}`, 
      updateData
    ).pipe(
      map(response => {
        return {
          email: response.email,
          name: response.name,
          role: response.role,
          active: response.active
        };
      }),
      catchError(error => {
        console.error('❌ Error in update:', error);
        if (error.status === 401) {
          return throwError(() => new Error('No autorizado'));
        } else if (error.status === 403) {
          return throwError(() => new Error('No tiene permisos para realizar esta acción'));
        }
        return throwError(() => new Error('Error al actualizar el repartidor'));
      })
    );
  }

  disableDeliveryPerson(email: string): Observable<any> {
    return this.http.post(`${this.usersUrl}/users/disable`, email, {
      headers: new HttpHeaders({
        'Content-Type': 'text/plain'
      }),
      responseType: 'text'
    }).pipe(
      catchError(error => {
        return throwError(() => new Error('Error al dar de baja al usuario'));
      })
    );
  }
}
