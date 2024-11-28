import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { AuthenticationService } from 'src/app/services/authenticationService.service';
import { Location } from '@angular/common';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { ModalStockComponent } from '../modals/modal-stock/modal-form-stock/modal-stock.component';
import { ModalStockDetailComponent } from '../modals/modal-stock/modal-stock-detail/modal-stock-detail.component';
import { Product } from '../../interfaces/product.interface';
import { DeleteProductDialogComponent } from '../modals/confirmation-dialog/delete-product-dialog.component';
import { StockService } from '../../app/services/stockService/stock-service';
import { MatSnackBar } from '@angular/material/snack-bar';
interface IncomeHistory {
  date: Date;
  amount: number;
  description: string;
}

@Component({
  selector: 'app-stock-management',
  templateUrl: './stock-management.component.html',
  styleUrls: ['./stock-management.component.css']
})
export class StockManagementComponent implements OnInit, AfterViewInit {
  isAdmin: boolean = false;
  products: Product[] = [];
  dataSource: MatTableDataSource<Product>;
  displayedColumns: string[] = ['id', 'name', 'stock', 'price'];
  isMobile: boolean = false;
  
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private authService: AuthenticationService,
    private location: Location,
    private router: Router,
    private dialog: MatDialog,
    private stockService: StockService,
    private snackBar: MatSnackBar
  ) {
    this.isAdmin = this.authService.isAdmin();
    this.dataSource = new MatTableDataSource<Product>(this.products);
  }

  ngOnInit(): void {
    this.loadProducts();
    this.checkScreenSize();
    window.addEventListener('resize', () => {
      this.checkScreenSize();
    });
  }

  ngAfterViewInit() {
    if (this.paginator && this.sort) {
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
    }
  }

  private loadProducts(): void {
    this.stockService.getProducts().subscribe({
      next: (products: Product[]) => {
        this.products = products;
        this.dataSource.data = this.products;
      },
      error: (error: any) => {
        console.error('Error al cargar productos:', error);
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

  private showSuccess(message: string): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: 3000,
      panelClass: ['success-snackbar']
    });
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  getTotalProducts(): number {
    return this.products.length;
  }

  deleteProduct(product: Product): void {
    const dialogRef = this.dialog.open(DeleteProductDialogComponent, {
      width: '400px',
      data: product,
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.stockService.deleteProduct(product.id).subscribe({
          next: () => {
            const index = this.products.findIndex(p => p.id === product.id);
            if (index !== -1) {
              this.products.splice(index, 1);
              this.dataSource.data = [...this.products];
              this.showSuccess('Producto eliminado correctamente');
            }
          },
          error: (error) => {
            console.error('Error deleting product:', error);
            this.showError('Error al eliminar el producto');
          }
        });
      }
    });
  }

  goBack(): void {
    if (window.history.length > 1) {
      this.location.back();
    } else {
      this.router.navigate(['/home']);
    }
  }

  openStockModal(product?: Product): void {
    const dialogRef = this.dialog.open(ModalStockComponent, {
      width: '600px',
      data: product,
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        if (result.id) {
          // Update existing product
          this.stockService.updateProduct(result).subscribe({
            next: (updatedProduct: Product) => {
              const index = this.products.findIndex(p => p.id === updatedProduct.id);
              if (index !== -1) {
                this.products[index] = updatedProduct;
                this.dataSource.data = [...this.products];
                this.showSuccess('Producto actualizado correctamente');
              }
            },
            error: (error) => {
              console.error('Error updating product:', error);
              this.showError('Error al actualizar el producto');
            }
          });
        } else {
          // Handle new product creation
          this.stockService.createProduct(result).subscribe({
            next: (newProduct) => {
              this.products.push(newProduct);
              this.dataSource.data = [...this.products];
              this.showSuccess('Producto creado correctamente');
            },
            error: (error) => {
              console.error('Error creating product:', error);
              this.showError('Error al crear el producto');
            }
          });
        }
      }
    });
  }

  openStockDetailModal(product: Product): void {
    const dialogRef = this.dialog.open(ModalStockDetailComponent, {
      width: '600px',
      data: product,
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.action === 'edit') {
        this.openStockModal(result.product);
      }
    });
  }

  clearFilters(): void {
    if (this.dataSource) {
      this.dataSource.filterPredicate = (data: Product, filter: string) => {
        return data.name.toLowerCase().includes(filter);
      };
      
      this.dataSource.filter = '';
      
      if (this.dataSource.paginator) {
        this.dataSource.paginator.firstPage();
      }
      
      const searchInput = document.querySelector('.search-field input') as HTMLInputElement;
      if (searchInput) {
        searchInput.value = '';
      }
    }
  }

  filterLowStock(): void {
    this.dataSource.filterPredicate = (data: Product, filter: string) => {
      if (filter === 'lowstock') {
        return data.stock < 40;
      }
      return data.name.toLowerCase().includes(filter.toLowerCase());
    };
    this.dataSource.filter = 'lowstock';
  }

  getLowStockProducts(): number {
    return this.products.filter(product => product.stock < 40).length;
  }

  getTotalValue(): number {
    return this.products.reduce((total, product) => {
      return total + (product.price * product.stock);
    }, 0);
  }

  private checkScreenSize() {
    this.isMobile = window.innerWidth <= 768;
    this.displayedColumns = ['id', 'name', 'stock', 'price'];
  }
}
