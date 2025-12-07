import { Component, OnInit, AfterViewInit, ViewChild, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableDataSource } from '@angular/material/table';
import { Location } from '@angular/common';
import { Router } from '@angular/router';

import { Product } from '../../../../interfaces/product.interface';
import { ProductService } from '../../../../services/productService/product.service';
import { AuthenticationService } from '../../../../services/authentication.service';
import { NewProductDialogComponent } from '../../dialogs/products/newProductDialog/newProductDialog.component';
import { ProductDetailsDialogComponent } from '../../dialogs/products/productDetailsDialog/productDetailsDialog.component';
import { EditProductDialogComponent } from '../../dialogs/products/editProductDialog/editProductDialog.component';

@Component({
  selector: 'app-product',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatInputModule,
    MatFormFieldModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    MatProgressSpinnerModule,
    MatDialogModule,
  ],
  templateUrl: './product.component.html',
  styleUrl: './product.component.css'
})
export class ProductComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = ['name', 'price', 'returnable'];
  dataSource: MatTableDataSource<Product>;
  isLoading = true;
  isMobile = false;
  isAdmin = false;
  products: Product[] = [];

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private router: Router,
    private location: Location,
    private authService: AuthenticationService,
    private productService: ProductService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.dataSource = new MatTableDataSource<Product>([]);
    this.isAdmin = this.authService.isAdmin();
  }

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.checkScreenSize();
      window.addEventListener('resize', () => this.checkScreenSize());
    }
    if (this.authService.currentUserValue) {
      this.loadProducts();
    }
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    this.dataSource.filterPredicate = (data: Product, filter: string) => {
      const value = (filter || '').trim();
      return this.tokenMatch(value,
        data.name,
        data.price,
        data.returnable ? 'retornable' : 'no retornable'
      );
    };
  }

  loadProducts() {
    this.isLoading = true;
    this.productService.getProducts().subscribe({
      next: (products) => {
        this.products = products;
        this.dataSource.data = this.products;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading products:', error);
        this.isLoading = false;
        this.showError('Error al cargar los productos');
      }
    });
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: 3000,
      panelClass: ['error-snackbar']
    });
  }

  private checkScreenSize() {
    if (!isPlatformBrowser(this.platformId)) return;
    this.isMobile = window.innerWidth <= 576;
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  private normalize(s: string): string {
    return (s ?? '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }

  private tokenMatch(query: string, ...fields: Array<string | number | null | undefined>): boolean {
    const tokens = this.normalize(query).split(/\s+/).filter(Boolean);
    const haystack = this.normalize(fields.map(v => String(v ?? '')).join(' '));
    return tokens.every(t => haystack.includes(t));
  }

  openNewProductDialog() {
    const dialogRef = this.dialog.open(NewProductDialogComponent, {
      width: '500px'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadProducts();
      }
    });
  }

  openProductDetails(product: Product) {
    const dialogRef = this.dialog.open(ProductDetailsDialogComponent, {
      width: '600px',
      data: product
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === 'edit') {
        this.openEditProductDialog(product);
      }
    });
  }

  openEditProductDialog(product: Product) {
    const dialogRef = this.dialog.open(EditProductDialogComponent, {
      width: '500px',
      data: product
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadProducts();
      }
    });
  }

  goBack(): void {
    this.location.back();
  }

  getTotalProducts(): number {
    return this.products.length;
  }

}
