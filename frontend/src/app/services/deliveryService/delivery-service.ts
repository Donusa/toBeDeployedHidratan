import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Delivery } from 'src/interfaces/delivery.interface';
import { catchError, map, tap } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { environment } from 'src/environments/environment';
import { ProductAdditionRequest } from 'src/interfaces/ProductAdditionRequest.interface';
import { DeliveryViewResponse } from 'src/interfaces/DeliveryViewResponse.interface';
import { AuthenticationService } from 'src/app/services/authenticationService.service';
import { DeliveryDto } from 'src/interfaces/deliveryDto.interface';

@Injectable({
  providedIn: 'root'
})
export class DeliveryService {
  private apiUrl = `${environment.apiUrl}${environment.endpoints.delivery.base}`;

  constructor(
    private http: HttpClient,
    private authService: AuthenticationService
  ) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  getDeliveries(): Observable<DeliveryViewResponse[]> {
    return this.http.get<DeliveryViewResponse[]>(`${this.apiUrl}/view`).pipe(
      catchError(error => {
        return throwError(() => new Error('Error al obtener los repartos'));
      })
    );
  }

  getDeliveriesToday(email: string): Observable<DeliveryDto[]> {
    return this.http.get<DeliveryDto[]>(`${this.apiUrl}/today/${email}`).pipe(
      catchError(error => {
        return throwError(() => new Error('Error al obtener los repartos de hoy'));
      })
    );
  }

  createDelivery(delivery: Delivery): Observable<Delivery> {
    if (!delivery.client?.id) {
      return throwError(() => new Error('ID de cliente no válido'));
    }

    const products = delivery.products.map(p => ({
      product: {
        id: p.id,
        name: p.name,
        price: p.price
      },
      quantity: p.stock
    }));

    const params = new HttpParams()
      .set('clientId', delivery.client.id.toString())
      .set('deliveryDate', delivery.deliveryDate)
      .set('assignedDeliverer', delivery.assignedTo)
      .set('status', delivery.status);

    return this.http.post<Delivery>(
      `${this.apiUrl}/create`,
      products,
      { 
        params,
        headers: this.getHeaders()
      }
    ).pipe(
      catchError(error => {
        return throwError(() => new Error('Error al crear el reparto'));
      })
    );
  }

  updateDelivery(viewResponse: DeliveryViewResponse): Observable<DeliveryViewResponse> {
    return this.http.put<DeliveryViewResponse>(`${this.apiUrl}/update`, viewResponse).pipe(
      catchError(error => {
        return throwError(() => new Error('Error al actualizar el reparto'));
      })
    );
  }

  editDelivery(delivery: Delivery): Observable<Delivery> {
    if (!delivery.client.id) {
      return throwError(() => new Error('ID de cliente no válido'));
    }

    const requestParams = new HttpParams()
      .set('clientId', delivery.client.id.toString())
      .set('deliveryDate', delivery.deliveryDate)
      .set('assignedDeliverer', delivery.assignedTo)
      .set('status', delivery.status);

    const products = delivery.products.map(product => ({
      product: {
        id: product.id,
        name: product.name,
        price: product.price,
        stock: product.stock
      },
      quantity: product.stock
    } as ProductAdditionRequest));

    return this.http.put<Delivery>(
      `${this.apiUrl}/edit`, 
      products, 
      { params: requestParams, headers: this.getHeaders() }
    ).pipe(
      catchError(error => {
        return throwError(() => new Error('Error al editar el reparto'));
      })
    );
  }

  completeDelivery(id: number, payment?: number): Observable<string> {
    if (!id) {
      return throwError(() => new Error('ID de reparto no válido'));
    }

    const params = new HttpParams()
      .set('id', id.toString())
      .set('payment', (payment || 0).toString());

    return this.http.post(`${this.apiUrl}/completeDelivery`, null, {
      params: params,
      responseType: 'text'
    }).pipe(
      tap(response => {
      }),
      map(response => {
        if (response === 'Delivery completed successfully') {
          return response;
        }
        throw new Error('Respuesta inesperada del servidor');
      }),
      catchError(error => {
        console.error('Error detallado:', error);
        return throwError(() => new Error('Error al completar el reparto'));
      })
    );
  }

  cancelDelivery(id: number): Observable<string> {
    if (!id) {
      return throwError(() => new Error('ID de reparto no válido'));
    }

    const params = new HttpParams().set('id', id.toString());

    return this.http.post(`${this.apiUrl}/cancelDelivery`, null, {
      params: params,
      responseType: 'text'
    }).pipe(
      map(response => {
        if (response === 'Delivery canceled successfully') {
          return response;
        }
        throw new Error('Respuesta inesperada del servidor');
      }),
      catchError(error => {
        console.error('Error al cancelar el reparto:', error);
        return throwError(() => new Error('Error al cancelar el reparto'));
      })
    );
  }

  updateDeliveryAssignment(
    id: number,
    assignedDeliverer: string,
    client: any,
    status: string,
    deliveryDate: string,
    products: any[]
  ): Observable<Delivery> {
    const formattedProducts = products.map(p => ({
      product: {
        id: p.product.id,
        name: p.product.name,
        price: p.product.price
      },
      quantity: p.quantity
    }));

    const params = new HttpParams()
      .set('assignedDeliverer', assignedDeliverer)
      .set('client', client.id.toString())
      .set('status', status)
      .set('deliveryDate', deliveryDate);

    return this.http.put<Delivery>(
      `${this.apiUrl}/update/${id}`,
      formattedProducts, 
      { 
        params,
        headers: this.getHeaders() 
      }
    ).pipe(
      catchError(error => {
        console.error('Error updating delivery:', error);
        return throwError(() => new Error('Error al actualizar el reparto'));
      })
    );
  }

}
