import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { Observable, throwError, of } from 'rxjs';
import { catchError, map, tap, switchMap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { AuthenticationService } from '../authentication.service';
import { DeliveryViewResponse } from '../../interfaces/DeliveryViewResponse.interface';
import { isPlatformBrowser } from '@angular/common';
import { ClientService } from '../clientService/client.service';
import { DeliveryReport } from '../../interfaces/DeliveryReport.interface';

@Injectable({
  providedIn: 'root'
})
export class VisitService {
  private apiUrl = `${environment.apiUrl}${environment.endpoints.delivery.base}`;

  constructor(
    private http: HttpClient,
    private authService: AuthenticationService,
    @Inject(PLATFORM_ID) private platformId: Object,
    private clientService: ClientService
  ) {}

  private getHeaders(): HttpHeaders {
    let token = '';
    if (isPlatformBrowser(this.platformId)) {
      token = sessionStorage.getItem('access_token') || '';
    }
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }


  getVisits(): Observable<DeliveryViewResponse[]> {
    const isAdmin = this.authService.isAdmin();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return this.http.get<DeliveryViewResponse[]>(
      `${this.apiUrl}/view`,
      {
        headers: this.getHeaders()
      }
    ).pipe(
      map(visits => {
        if (!isAdmin) {
          return visits.filter(visit => {
            const isDelivererVisit = visit.delivererEmail === this.authService.getCurrentEmail();
            
            if (!visit.deliveryDate) return false;
            try {
              const [datePart] = visit.deliveryDate.split('T');
              const [day, month, year] = datePart.split('/');
              const visitDate = new Date(+year, +month - 1, +day);
              visitDate.setHours(0, 0, 0, 0);
              
              return isDelivererVisit && visitDate.getTime() === today.getTime();
            } catch (error) {
              return false;
            }
          });
        }
        return visits;
      }),
      catchError(error => {
        console.error('Error fetching visits:', error);
        return throwError(() => new Error('Error al obtener las visitas'));
      })
    );
  }

  createVisit(visitData: any): Observable<any> {
    const params = new HttpParams()
      .set('clientId', visitData.clientId)
      .set('deliveryDate', visitData.date)
      .set('assignedDeliverer', visitData.delivererEmail)
      .set('status', 'PENDING');

    const headers = this.getHeaders();

    return this.http.post<any>(
      `${this.apiUrl}/create`,
      null,
      {
        headers: headers,
        params: params
      }
    ).pipe(
      catchError(error => {
        console.error('Error in createVisit:', error);
        return throwError(() => error);
      })
    );
  }

  updateVisit(id: number, visitData: any): Observable<any> {
    if (!id) {
      return throwError(() => new Error('ID de visita no válido'));
    }

    const params = new HttpParams()
      .set('assignedDeliverer', visitData.delivererEmail)
      .set('client', visitData.clientId)
      .set('deliveryDate', visitData.date);

    return this.http.put(
      `${this.apiUrl}/update/${id}`,
      null,
      { 
        headers: this.getHeaders(),
        params: params 
      }
    ).pipe(
      map(response => response),
      catchError(error => {
        console.error('Error updating visit:', error);
        return throwError(() => new Error('Error al actualizar la visita'));
      })
    );
  }

  deleteVisit(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }

  getVisitById(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  processPayment(clientId: number, newDebt: number): Observable<string> {
    if (!clientId) {
      return throwError(() => new Error('Datos de pago inválidos'));
    }

    const params = new HttpParams()
      .set('clientId', clientId.toString())
      .set('newDebt', newDebt.toString());
      
    return this.http.post(
      `${this.apiUrl}/pay`,
      null,
      {
        params,
        headers: this.getHeaders(),
        responseType: 'text'
      }
    ).pipe(
      map(response => {
        if (response === 'Payment processed successfully') {
          return response;
        }
        throw new Error('Respuesta inesperada del servidor');
      }),
      catchError(error => {
        console.error('Error processing payment:', error);
        return throwError(() => new Error('Error al procesar el pago'));
      })
    );
  }

  transferProduct(deliveryManEmail: string, clientId: number, productId: number, quantity: number): Observable<string> {
    if (!deliveryManEmail || !clientId || !productId || quantity <= 0) {
      return throwError(() => new Error('Datos de transferencia inválidos'));
    }

    const params = new HttpParams()
      .set('deliveryManEmail', deliveryManEmail)
      .set('clientId', clientId.toString())
      .set('productId', productId.toString())
      .set('quantity', quantity.toString());

    return this.http.post(
      `${this.apiUrl}/transferProduct`,
      null,
      {
        params,
        headers: this.getHeaders(),
        responseType: 'text'
      }
    ).pipe(
      map(response => {
        if (response === 'Product transfered successfully') {
          return response;
        }
        throw new Error('Respuesta inesperada del servidor');
      }),
      catchError(error => {
        console.error('Error transferring product:', error);
        return throwError(() => new Error('Error al transferir el producto'));
      })
    );
  }

  returnProduct(clientId: number, deliveryManEmail: string, productId: number, quantity: number, debt: number): Observable<string> {
    if (!clientId || !deliveryManEmail || !productId || quantity <= 0) {
      return throwError(() => new Error('Datos de retorno inválidos'));
    }

    const params = new HttpParams()
      .set('clientId', clientId.toString())
      .set('deliveryManEmail', deliveryManEmail)
      .set('productId', productId.toString())
      .set('quantity', quantity.toString())
      .set('debt', debt.toString());

    return this.http.post(
      `${this.apiUrl}/returnProduct`,
      null,
      {
        params,
        headers: this.getHeaders(),
        responseType: 'text'
      }
    ).pipe(
      map(response => {
        if (response === 'Product returned successfully and added to empty products list') {
          return response;
        }
        throw new Error('Respuesta inesperada del servidor');
      }),
      catchError(error => {
        console.error('Error returning product:', error);
        return throwError(() => new Error('Error al retornar el producto'));
      })
    );
  }

  completeVisit(id: number): Observable<any> {
    if (!id) {
      return throwError(() => new Error('ID de visita no válido'));
    }

    return this.http.put(
      `${this.apiUrl}/${id}/complete`,
      null,
      {
        headers: this.getHeaders()
      }
    ).pipe(
      catchError(error => {
        console.error('Error completing visit:', error);
        return throwError(() => new Error('Error al completar la visita'));
      })
    );
  }

  cancelVisit(id: number): Observable<any> {
    if (!id) {
      return throwError(() => new Error('ID de visita no válido'));
    }

    return this.http.put(
      `${this.apiUrl}/cancel/${id}`,
      null,
      {
        headers: this.getHeaders()
      }
    ).pipe(
      catchError(error => {
        console.error('Error canceling visit:', error);
        return throwError(() => new Error('Error al cancelar la visita'));
      })
    );
  }

  getDeliveriesToday(delivererEmail: string): Observable<DeliveryReport[]> {
    return this.http.get<DeliveryReport[]>(`${this.apiUrl}/report/${delivererEmail}`, {
        headers: this.getHeaders()
    }).pipe(
        catchError(error => {
            console.error('Error fetching deliveries:', error);
            return throwError(() => new Error('Error al obtener los repartos de hoy'));
        })
    );
  }


} 