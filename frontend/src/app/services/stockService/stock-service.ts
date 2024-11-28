import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { Product } from 'src/interfaces/product.interface';
@Injectable({
  providedIn: 'root'
})
export class StockService {
  private apiUrl = `${environment.apiUrl}${environment.endpoints.products.base}`;

  constructor(private http: HttpClient) { }

  createProduct(product: Product): Observable<Product> {
    const params = new HttpParams()
      .set('name', product.name)
      .set('price', product.price.toString())
      .set('stock', product.stock.toString());

    return this.http.post<Product>(`${this.apiUrl}/save`, null, { params })
      .pipe(
        catchError(this.handleError)
      );
  }

  getProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.apiUrl}/list`)
      .pipe(
        catchError(this.handleError)
      );
  }

  updateProduct(product: Product): Observable<Product> {
    const params = new HttpParams()
      .set('id', product.id.toString())
      .set('name', product.name)
      .set('price', product.price.toString())
      .set('stock', product.stock.toString());

    return this.http.put<Product>(`${this.apiUrl}/update`, null, { params })
      .pipe(
        catchError(error => {
          console.error('Error updating product:', error);
          return throwError(() => new Error('Error al actualizar el producto'));
        })
      );
  }

  deleteProduct(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Ha ocurrido un error';
    
    if (error.error instanceof ErrorEvent) {
      // Error del lado del cliente
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Error del lado del servidor
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
    }
    
    console.error(errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}
