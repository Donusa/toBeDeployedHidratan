import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';
import { catchError, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class HealthDataService {
  private readonly JSON_PATH = 'assets/health-data.json';
  private readonly STORAGE_KEY = 'health_data_local_override';

  constructor(private http: HttpClient, @Inject(PLATFORM_ID) private platformId: Object) { }

  getHealthData(): Observable<any> {
    // Primero intentamos leer del localStorage (override temporal)
    if (isPlatformBrowser(this.platformId)) {
      const localData = localStorage.getItem(this.STORAGE_KEY);
      if (localData) {
        return of({ data: localData });
      }
    }

    // Si no hay local, leemos el JSON estático
    return this.http.get<any>(this.JSON_PATH).pipe(
      catchError(error => {
        console.error('Error loading health-data.json', error);
        return of({ data: '' });
      })
    );
  }

  saveHealthData(data: string): Observable<any> {
    // Como no podemos escribir en el archivo JSON desde el navegador,
    // guardamos en localStorage para que el usuario vea sus cambios reflejados
    // y devolvemos éxito para que la UI no falle.
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(this.STORAGE_KEY, data);
    }
    return of({ success: true, data });
  }

  getPublicHealthData(): Observable<any> {
    // Para el público, leemos directamente el JSON
    return this.http.get<any>(this.JSON_PATH).pipe(
      catchError(error => {
        console.error('Error loading public health-data.json', error);
        return of({ data: '' });
      })
    );
  }
}
