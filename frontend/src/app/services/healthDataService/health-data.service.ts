import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, catchError, throwError, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class HealthDataService {
  private readonly STORAGE_KEY = 'health_data_info';

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
    if (isPlatformBrowser(this.platformId)) {
      const data = localStorage.getItem(this.STORAGE_KEY) || '';
      return of({ data });
    }
    return of({ data: '' });
  }

  saveHealthData(data: string): Observable<any> {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(this.STORAGE_KEY, data);
      return of({ success: true, data });
    }
    return of({ success: false });
  }

  getPublicHealthData(): Observable<any> {
    // Public data is now handled via URL params in the component
    // but we can return empty here to satisfy interface if needed
    return of({ data: '' });
  }
}
