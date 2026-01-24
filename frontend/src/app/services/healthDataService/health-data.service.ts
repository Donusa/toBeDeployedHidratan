import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, catchError, throwError, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class HealthDataService {
  private apiUrl = `${environment.apiUrl}${environment.endpoints.healthData.management}`;
  private publicUrl = `${environment.apiUrl}${environment.endpoints.healthData.base}`;

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

  getHealthData(): Observable<any> {
    return this.http.get<any>(this.apiUrl, { 
      headers: this.getHeaders() 
    }).pipe(
      catchError(error => {
        console.error('Error fetching health data:', error);
        return throwError(() => new Error('Error al obtener los datos de sanidad'));
      })
    );
  }

  saveHealthData(data: string): Observable<any> {
    return this.http.post<any>(this.apiUrl, { data }, { 
      headers: this.getHeaders() 
    }).pipe(
      catchError(error => {
        console.error('Error saving health data:', error);
        return throwError(() => new Error('Error al guardar los datos de sanidad'));
      })
    );
  }

  getPublicHealthData(): Observable<any> {
    return this.http.get<any>(this.publicUrl).pipe(
      catchError(error => {
        console.error('Error fetching public health data:', error);
        return throwError(() => new Error('Error al obtener los datos públicos de sanidad'));
      })
    );
  }
}
