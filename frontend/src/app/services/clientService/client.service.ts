import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map, catchError, throwError } from 'rxjs';
import { Client } from '../../interfaces/client.interface';
import { environment } from '../../../environments/environment';
import { ClientStock } from '../../interfaces/clientStock.interface';

@Injectable({
  providedIn: 'root'
})
export class ClientService {
  private apiUrl = `${environment.apiUrl}${environment.endpoints.clients.base}`;

  constructor(private http: HttpClient) { }

  private getHeaders(): HttpHeaders {
    const token = sessionStorage.getItem('access_token');
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
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
}