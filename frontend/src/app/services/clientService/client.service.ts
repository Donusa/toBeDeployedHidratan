import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Client } from 'src/interfaces/client.interface';
import { environment } from 'src/environments/environment';
@Injectable({
  providedIn: 'root'
})
export class ClientService {
  private apiUrl = `${environment.apiUrl}${environment.endpoints.clients.base}`;

  constructor(private http: HttpClient) { }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('access_token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  getClients(): Observable<Client[]> {
    return this.http.get(`${this.apiUrl}/clients`, { 
      headers: this.getHeaders(),
      responseType: 'text'
    }).pipe(
      map(response => {
        try {
          const parsed = JSON.parse(response) as Client[];
          return parsed;
        } catch (error) {
          console.error('Error parsing client response:', error);
          return [];
        }
      })
    );
  }

  createClient(client: Client): Observable<Client> {
    return this.http.post<Client>(`${this.apiUrl}/clients`, client, { headers: this.getHeaders() });
  }

  updateClient(client: Client): Observable<Client> {
    return this.http.put<Client>(`${this.apiUrl}/clients/${client.id}`, {
      id: client.id,
      name: client.name,
      address: client.address,
      debt: client.debt,
      frecuency: client.frecuency,
      clientProducts: []
    }, { headers: this.getHeaders() });
  }

} 