import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Product } from '../../interfaces/product.interface';

interface ProductResponse {
  id: number;
  name: string;
  price: number;
  returnable: boolean;
  stock: number;
}

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private apiUrl = `${environment.apiUrl}/products`;

  constructor(private http: HttpClient) { }

  private getHeaders(): HttpHeaders {
    const token = sessionStorage.getItem('access_token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  getProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.apiUrl}/list`, {
      headers: this.getHeaders()
    }).pipe(
      catchError(error => {
        console.error('Error fetching products:', error);
        return throwError(() => new Error('Error al obtener los productos'));
      })
    );
  }

  getProduct(id: number): Observable<Product> {
    return this.http.get<ProductResponse>(`${this.apiUrl}/${id}`, {
      headers: this.getHeaders()
    }).pipe(
      map(response => ({
        id: response.id,
        name: response.name,
        price: response.price,
        returnable: response.returnable,
        stock: response.stock
      })),
      catchError(error => throwError(() => error))
    );
  }

  createProduct(product: Partial<Product>): Observable<Product> {
    const params = new HttpParams()
      .set('name', product.name!)
      .set('price', product.price!)
      .set('returnable', product.returnable!);

    return this.http.post<ProductResponse>(`${this.apiUrl}/save`, null, {
      headers: this.getHeaders(),
      params: params
    }).pipe(
      map(response => ({
        id: response.id,
        name: response.name,
        price: response.price,
        returnable: response.returnable,
        stock: response.stock
      })),
      catchError(error => {
        if (error.status === 409) {
          return throwError(() => new Error('El producto ya existe'));
        }
        return throwError(() => new Error('Error al crear el producto'));
      })
    );
  }

  updateProduct(id: number, product: Partial<Product>): Observable<Product> {
    const params = new HttpParams()
      .set('id', id)
      .set('name', product.name!)
      .set('price', product.price!)
      .set('returnable', product.returnable!);

    return this.http.put<ProductResponse>(`${this.apiUrl}/update`, null, {
      headers: this.getHeaders(),
      params: params
    }).pipe(
      map(response => ({
        id: response.id,
        name: response.name,
        price: response.price,
        returnable: response.returnable,
        stock: response.stock
      })),
      catchError(error => throwError(() => error))
    );
  }

  deleteProduct(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, {
      headers: this.getHeaders()
    }).pipe(
      catchError(error => throwError(() => error))
    );
  }

  updateStock(id: number, quantity: number): Observable<Product> {
    return this.http.patch<ProductResponse>(`${this.apiUrl}/${id}/stock`, { quantity }, {
      headers: this.getHeaders()
    }).pipe(
      map(response => ({
        id: response.id,
        name: response.name,
        price: response.price,
        returnable: response.returnable,
        stock: response.stock
      })),
      catchError(error => throwError(() => error))
    );
  }
} 