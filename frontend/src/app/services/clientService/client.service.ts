import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, map, catchError, throwError } from 'rxjs';
import { Client } from '../../interfaces/client.interface';
import { environment } from '../../../environments/environment';
import { ClientStock } from '../../interfaces/clientStock.interface';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class ClientService {
  private apiUrl = `${environment.apiUrl}${environment.endpoints.clients.base}`;

  constructor(private http: HttpClient, @Inject(PLATFORM_ID) private platformId: Object) { }

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

  getClients(): Observable<Client[]> {
    return this.http.get<Client[]>(`${this.apiUrl}${environment.endpoints.clients.clients}`, { 
      headers: this.getHeaders() 
    });
  }

  createClient(client: Client): Observable<Client> {
    return this.http.post<Client>(`${this.apiUrl}${environment.endpoints.clients.clients}`, client, { 
      headers: this.getHeaders() 
    });
  }

  updateClient(client: Client): Observable<Client> {
    const url = `${this.apiUrl}${environment.endpoints.delivery.updateClient.replace('{id}', client.id.toString())}`;
    return this.http.put<Client>(url, {
      id: client.id,
      address: client.address,
      debt: client.debt,
      frecuency: client.frecuency,
      phoneNumber: client.phoneNumber,
      zone: client.zone,
      observations: client.observations,
      clientProducts: []
    }, { 
      headers: this.getHeaders() 
    });
  }

  getClientStock(clientId: number): Observable<ClientStock[]> {
    return this.http.get<ClientStock[]>(`${environment.apiUrl}${environment.endpoints.management.base}/clients/${clientId}/stock`, {
      headers: this.getHeaders()
    }).pipe(
      catchError(error => {
        console.error('Error fetching client stock:', error);
        return throwError(() => new Error('Error al obtener el stock del cliente'));
      })
    );
  }

  getClientTransactions(clientId: number): Observable<any[]> {
    const url = `${environment.apiUrl}${environment.endpoints.delivery.base}/clients/${clientId}/transactions`;
    return this.http.get<any[]>(url, {
      headers: this.getHeaders()
    });
  }

  deleteClientHistoryEntry(clientId: number, transactionId: number): Observable<void> {
    const url = `${environment.apiUrl}${environment.endpoints.delivery.base}/clients/${clientId}/transactions/${transactionId}`;
    return this.http.delete<void>(url, { headers: this.getHeaders() });
  }

  addClientStock(clientId: number, productId: number, quantity: number): Observable<string> {
    const url = `${environment.apiUrl}${environment.endpoints.management.base}/clients/${clientId}/stock/add`;
    const params = new HttpParams()
      .set('productId', productId)
      .set('quantity', quantity);
    return this.http.post(url, null, {
      headers: this.getHeaders(),
      params,
      responseType: 'text'
    }).pipe(map(() => 'OK'));
  }

  removeClientStock(clientId: number, productId: number, quantity: number): Observable<string> {
    const url = `${environment.apiUrl}${environment.endpoints.management.base}/clients/${clientId}/stock/remove`;
    const params = new HttpParams()
      .set('productId', productId)
      .set('quantity', quantity);
    return this.http.post(url, null, {
      headers: this.getHeaders(),
      params,
      responseType: 'text'
    }).pipe(map(() => 'OK'));
  }

  deleteClient(clientId: number): Observable<string> {
    const url = `${this.apiUrl}${environment.endpoints.delivery.updateClient.replace('{id}', clientId.toString())}`;
    return this.http.delete(url, {
      headers: this.getHeaders(),
      responseType: 'text'
    }).pipe(map(() => 'OK'));
  }
}
