import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { DeliveryViewResponse } from '../../../../../interfaces/DeliveryViewResponse.interface';
import { AuthenticationService } from '../../../../../services/authentication.service';
import { EditVisitDialogComponent } from '../editVisitDialog/editVisitDialog.component';
import { VisitService } from '../../../../../services/visitService/visit.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { ProductService } from '../../../../../services/productService/product.service';
import { AddProductToVisitDialogComponent } from '../addProductToVisitDialog/addProductToVisitDialog.component';
import { DatePipe } from '@angular/common';
import { AddPaymentDialogComponent } from '../addPaymentDialog/addPaymentDialog.component';
import { DelivererService } from '../../../../../services/delivererService/deliverer.service';
import { DelivererStock } from '../../../../../interfaces/delivererStock.interface';
import { ClientService } from '../../../../../services/clientService/client.service';
import { ClientStock } from '../../../../../interfaces/clientStock.interface';
import { Observable, forkJoin, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { ConfirmDialogComponent } from '../../../../shared/confirmDialog/confirmDialog.component';

@Component({
  selector: 'app-visit-details-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
  ],
  templateUrl: './visitDetailsDialog.component.html',
  styleUrl: './visitDetailsDialog.component.css',
  providers: [DatePipe]
})
export class VisitDetailsDialogComponent {
  displayedProductColumns: string[] = ['product', 'quantity', 'actions'];
  deliveryProducts = new MatTableDataSource<any>([]);
  returnProducts = new MatTableDataSource<any>([]);
  availableDelivererProducts: DelivererStock[] = [];
  availableClientProducts: ClientStock[] = [];
  isAdmin = true;
  currentPayment: number = 0;

  constructor(
    public dialogRef: MatDialogRef<VisitDetailsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DeliveryViewResponse,
    private authService: AuthenticationService,
    private datePipe: DatePipe,
    private dialog: MatDialog,
    private visitService: VisitService,
    private snackBar: MatSnackBar,
    private productService: ProductService,
    private delivererService: DelivererService,
    private clientService: ClientService
  ) {
    this.isAdmin = this.authService.isAdmin();
    this.loadStocks();
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    
    try {
      const [datePart, timePart] = dateString.split('T');
      const [day, month, year] = datePart.split('/');
      const date = new Date(+year, +month - 1, +day);
      
      if (timePart) {
        const [hours, minutes] = timePart.split(':');
        date.setHours(+hours, +minutes);
      }
      
      return this.datePipe.transform(date, 'dd/MM/yyyy HH:mm') || 'N/A';
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'N/A';
    }
  }

  formatDateOnly(dateString: string): string {
    if (!dateString) return 'N/A';
    
    try {
      const [datePart] = dateString.split('T');
      const [day, month, year] = datePart.split('/');
      return `${day}/${month}/${year}`;
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'N/A';
    }
  }

  formatTimeOnly(dateString: string): string {
    if (!dateString) return 'N/A';
    
    try {
      const [, timePart] = dateString.split('T');
      return timePart || 'N/A';
    } catch (error) {
      console.error('Error formatting time:', error);
      return 'N/A';
    }
  }

  getStatusLabel(status: string): string {
    const statusMap: { [key: string]: string } = {
      'PENDING': 'Pendiente',
      'IN_PROGRESS': 'En Progreso',
      'COMPLETED': 'Completado',
      'CANCELLED': 'Cancelado'
    };
    return statusMap[status] || status;
  }

  getStatusClass(status: string): string {
    return status.toLowerCase();
  }

  onClose(): void {
    this.dialogRef.close();
  }

  onEdit(): void {
    if (this.data.status === 'COMPLETED') return;
    const dialogRef = this.dialog.open(EditVisitDialogComponent, {
      width: '500px',
      data: {
        deliverId: this.data.deliverId,
        client: this.data.client,
        deliverer: {
          email: this.data.delivererEmail,
          name: this.data.delivererName
        },
        date: this.data.deliveryDate,
        status: this.data.status
      },
      enterAnimationDuration: '200ms',
      exitAnimationDuration: '200ms'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        Object.assign(this.data, result);
      }
    });
  }

  loadStocks() {
    if (this.data.delivererEmail) {
      this.delivererService.getDelivererStock(this.data.delivererEmail).subscribe({
        next: (stock) => {
          this.availableDelivererProducts = stock;
        },
        error: (error) => {
          console.error('Error loading deliverer stock:', error);
          this.snackBar.open('Error al cargar el stock del repartidor', 'Cerrar', {
            duration: 3000
          });
        }
      });
    }

    if (this.data.client?.id) {
      this.clientService.getClientStock(this.data.client.id).subscribe({
        next: (stock) => {
          this.availableClientProducts = stock;
        },
        error: (error) => {
          console.error('Error loading client stock:', error);
          this.snackBar.open('Error al cargar el stock del cliente', 'Cerrar', {
            duration: 3000
          });
        }
      });
    }
  }

  addProduct(type: 'delivery' | 'return'): void {
    if (this.data.status === 'COMPLETED') return;
    const dialogRef = this.dialog.open(AddProductToVisitDialogComponent, {
      width: '400px',
      data: {
        availableProducts: type === 'delivery' 
          ? this.availableDelivererProducts.filter(stock => true)
          : this.availableClientProducts.filter(stock => stock.product.returnable),
        clientId: this.data.client.id,
        type: type
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        if (type === 'delivery') {
          this.deliveryProducts.data = [...this.deliveryProducts.data, result];
        } else {
          this.returnProducts.data = [...this.returnProducts.data, result];
        }
      }
    });
  }

  removeProduct(index: number, type: 'delivery' | 'return'): void {
    if (this.data.status === 'COMPLETED') return;
    if (type === 'delivery') {
      const currentData = this.deliveryProducts.data;
      currentData.splice(index, 1);
      this.deliveryProducts.data = [...currentData];
    } else {
      const currentData = this.returnProducts.data;
      currentData.splice(index, 1);
      this.returnProducts.data = [...currentData];
    }
  }

  addPayment(): void {
    if (this.data.status === 'COMPLETED') return;
    const dialogRef = this.dialog.open(AddPaymentDialogComponent, {
      width: '400px',
      data: {
        currentDebt: this.data.client.debt
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.currentPayment = result.amount;
      }
    });
  }

  onSave(): void {
    if (this.data.status === 'COMPLETED') return;
    const tasks: Observable<any>[] = [];

    // Payment
    if (this.currentPayment > 0) {
      tasks.push(
        this.visitService.processPayment(this.data.client.id, this.currentPayment)
      );
    }

    // Delivery products
    this.deliveryProducts.data.forEach(item => {
      tasks.push(
        this.visitService.transferProduct(
          this.data.delivererEmail,
          this.data.client.id,
          item.product.id,
          item.quantity
        )
      );
    });

    // Return products
    this.returnProducts.data.forEach(item => {
      tasks.push(
        this.visitService.returnProduct(
          this.data.client.id,
          this.data.delivererEmail,
          item.product.id,
          item.quantity
        )
      );
    });

  
    forkJoin(tasks.length > 0 ? tasks : [of(null)]).pipe(
      switchMap(() => this.visitService.completeVisit(this.data.deliverId)),
      switchMap(() => {
        const nextVisitDate = this.calculateNextVisitDate(
          this.data.deliveryDate,
          this.data.client.frecuency
        );

        return this.visitService.createVisit({
          clientId: this.data.client.id,
          delivererEmail: this.data.delivererEmail,
          date: nextVisitDate
        });
      })
    ).subscribe({
      next: () => {
        this.snackBar.open('Visita finalizada y reprogramada exitosamente', 'Cerrar', {
          duration: 3000
        });
        this.dialogRef.close(true);
      },
      error: (error) => {
        console.error('Error processing visit:', error);
        this.snackBar.open('Error al procesar la visita', 'Cerrar', {
          duration: 3000
        });
      }
    });
  }

  private calculateNextVisitDate(currentDate: string, frecuency: number): string {
    const [datePart, timePart] = currentDate.split('T');
    const [day, month, year] = datePart.split('/');
    
    const date = new Date(+year, +month - 1, +day);
    date.setDate(date.getDate() + frecuency);
    
    if (date.getDay() === 0) {
      date.setDate(date.getDate() + 1);
    }
    
    const nextDay = String(date.getDate()).padStart(2, '0');
    const nextMonth = String(date.getMonth() + 1).padStart(2, '0');
    const nextYear = date.getFullYear();
    
    return `${nextDay}/${nextMonth}/${nextYear}T${timePart}`;
  }

  onCancel(): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Cancelar Visita',
        message: '¿Está seguro que desea cancelar esta visita? Esta acción no se puede deshacer.',
        confirmText: 'Sí, Cancelar',
        cancelText: 'No, Volver',
        color: 'warn',
        icon: 'cancel'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.visitService.cancelVisit(this.data.deliverId).subscribe({
          next: () => {
            this.snackBar.open('Visita cancelada exitosamente', 'Cerrar', {
              duration: 3000
            });
            this.data.status = 'CANCELLED';
            this.dialogRef.close(true);
          },
          error: (error) => {
            console.error('Error canceling visit:', error);
            this.snackBar.open('Error al cancelar la visita', 'Cerrar', {
              duration: 3000
            });
          }
        });
      }
    });
  }
} 