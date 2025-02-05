import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, catchError, throwError, of, switchMap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { map } from 'rxjs/operators';
import { Deliverer } from '../../interfaces/deliverer.interface';
import { AuthenticationResponse } from '../../interfaces/authenticationResponse.interface';
import { AppUserResponse } from '../../interfaces/appUserResponse.interface';
import { DelivererStock } from '../../interfaces/delivererStock.interface';
import { NotificationService } from '../notificationService/notification.service';
import { isPlatformBrowser } from '@angular/common';

interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  role: 'ROLE_ADMIN' | 'ROLE_DELIVERY';
}

@Injectable({
  providedIn: 'root'
})
export class DelivererService {
  private authUrl = `${environment.apiUrl}${environment.endpoints.auth.base}`;
  private usersUrl = `${environment.apiUrl}${environment.endpoints.management.base}`;

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object,
    private notificationService: NotificationService
  ) { }

  private getHeaders(): HttpHeaders {
    const token =sessionStorage.getItem('access_token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  getDeliverers(): Observable<Deliverer[]> {
    return this.http.get<AppUserResponse[]>(`${this.usersUrl}/users`, {
      headers: this.getHeaders()
    })
      .pipe(
        map(users => users.filter(user => ['ROLE_DELIVERY', 'ROLE_ADMIN'].includes(user.role))),
        catchError(error => throwError(() => error))
      );
  }

  getDelivererById(email: string): Observable<Deliverer> {
    return this.http.get<AppUserResponse>(`${this.usersUrl}/users/${email}`, {
      headers: this.getHeaders()
    }).pipe(
      map(user => ({
        email: user.email,
        name: user.name,
        role: user.role,
        active: user.active,
        products: user.products
      })),
      catchError(error => throwError(() => error))
    );
  }

  createDeliverer(deliverer: Partial<Deliverer>): Observable<Deliverer> {
    const registerRequest: RegisterRequest = {
      name: deliverer.name!,
      email: deliverer.email!,
      password: deliverer.password || 'defaultPassword123',
      role: 'ROLE_DELIVERY'
    };

    return this.http.post<AuthenticationResponse>(`${this.authUrl}/register`, registerRequest, {
      headers: this.getHeaders()
    }).pipe(
      map(response => ({
        name: registerRequest.name,
        email: registerRequest.email,
        role: registerRequest.role,
        active: true,
        products: []
      })),
      catchError(error => {
        console.error('Error creating deliverer:', error);
        if (error.status === 409) {
          return throwError(() => new Error('El email ya existe'));
        } else if (error.status === 400) {
          return throwError(() => new Error(error.error || 'La contraseña no cumple con los requisitos de seguridad'));
        }
        return throwError(() => new Error('Error al crear el repartidor'));
      })
    );
  }

  updateDeliverer(email: string, deliverer: Partial<Deliverer>): Observable<Deliverer> {
    return this.http.put<AppUserResponse>(`${this.usersUrl}/users`, deliverer, {
      headers: this.getHeaders(),
      params: new HttpParams().set('email', email)
    }).pipe(
      map(response => ({
        email: response.email,
        name: response.name,
        role: response.role,
        active: response.active,
        products: response.products
      })),
      catchError(error => throwError(() => error))
    );
  }

  disableDeliverer(email: string, name: string): Observable<void> {
    return this.http.post(`${this.usersUrl}/users/disable`, null, {
      headers: new HttpHeaders({
        'Content-Type': 'text/plain',
        'Authorization': `Bearer ${sessionStorage.getItem('access_token')}`
      }),
      params: new HttpParams().set('email', email),
      responseType: 'text'
    }).pipe(
      switchMap(() => this.getMatchingDeliveries(email)),
      map(deliveries => {
        if (deliveries.length > 0) {
          this.notificationService.notifyDelivererDisabled(name, deliveries);
        }
        return;
      }),
      catchError(error => {
        return throwError(() => new Error('Error al dar de baja al repartidor'));
      })
    );
  }

  private getMatchingDeliveries(email: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.usersUrl}/getMatchingDeliveries`, {
      params: new HttpParams().set('email', email),
      headers: this.getHeaders()
    }).pipe(
      catchError(error => {
        console.error('Error fetching matching deliveries:', error);
        return of([]);
      })
    );
  }

  updateDelivererStatus(email: string, active: boolean): Observable<Deliverer> {
    const action = active ? 'enable' : 'disable';
    return this.http.post(`${this.usersUrl}/users/${action}`, null, {
      headers: this.getHeaders(),
      params: new HttpParams().set('email', email),
      responseType: 'text'
    }).pipe(
      map(() => ({ email, active } as Deliverer)),
      catchError(error => {
        return throwError(() => new Error(`Error al ${active ? 'activar' : 'desactivar'} al repartidor`));
      })
    );
  }

  getDelivererStats(id: string): Observable<{
    totalDeliveries: number;
    rating: number;
    lastDelivery: Date;
  }> {
    return this.http.get<{
      totalDeliveries: number;
      rating: number;
      lastDelivery: Date;
    }>(`${this.usersUrl}/users/${id}/stats`);
  }

  getDelivererStock(email: string): Observable<DelivererStock[]> {
    return this.http.get<DelivererStock[]>(`${this.usersUrl}/users/${email}/stock`, {
      headers: this.getHeaders()
    }).pipe(
      catchError(error => {
        console.error('Error fetching deliverer stock:', error);
        return throwError(() => new Error('Error al obtener el stock del repartidor'));
      })
    );
  }

  addStockToDeliverer(productId: number, quantity: number, delivererEmail: string): Observable<any> {
    const params = new HttpParams()
      .set('productId', productId)
      .set('quantity', quantity)
      .set('delivererEmail', delivererEmail);

    return this.http.post(
      `${this.usersUrl}/users/addStock`, 
      null, 
      { 
        params,
        headers: this.getHeaders(),
        responseType: 'text'
      }
    ).pipe(
      map(response => {
        return response;
      }),
      catchError(error => {
        console.error('Error adding stock:', error);
        if (error.status === 200) {
          return of(error.error.text);
        }
        return throwError(() => new Error('Error al agregar stock al repartidor'));
      })
    );
  }
} 