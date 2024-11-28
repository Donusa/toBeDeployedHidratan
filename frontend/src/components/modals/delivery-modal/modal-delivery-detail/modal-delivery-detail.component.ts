import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { DeliveryViewResponse } from 'src/interfaces/DeliveryViewResponse.interface';
import { DeliveryService } from 'src/app/services/deliveryService/delivery-service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PaymentDialogComponent } from '../payment-dialog/payment-dialog.component';
import { ConfirmationDialogComponent } from '../confirmation-dialog/confirmation-dialog.component';
import { DatePipe } from '@angular/common';
import { AuthenticationService } from 'src/app/services/authenticationService.service';
import { ModalDeliveryComponent } from '../modal-form-delivery/modal-delivery.component';

@Component({
  selector: 'app-modal-delivery-detail',
  templateUrl: './modal-delivery-detail.component.html',
  styleUrls: ['./modal-delivery-detail.component.css']
})
export class ModalDeliveryDetailComponent implements OnInit {
  currentPayment: number = 0;
  clientStock: { name: string; stock: number; }[] = [];
  deliveryProducts: { name: string; stock: number; }[] = [];
  isDelivered: boolean = false;
  isAdmin: boolean = false;

  constructor(
    public dialogRef: MatDialogRef<ModalDeliveryDetailComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DeliveryViewResponse,
    private deliveryService: DeliveryService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private datePipe: DatePipe,
    private authService: AuthenticationService
  ) {
    this.isAdmin = this.authService.isAdmin();
  }

  ngOnInit() {
    this.isDelivered = this.data.status === 'COMPLETED' || 
                       this.data.status === 'Entregado' ||
                       this.data.status === 'CANCELED' ||
                       this.data.status === 'Cancelado';
    this.currentPayment = this.data.client.debt;
    
    if (this.data.client.clientProducts) {
      this.deliveryProducts = this.data.client.clientProducts.map(clientProduct => ({
        name: clientProduct.product.name,
        stock: clientProduct.quantity
      }));
    } else {
      this.deliveryProducts = [];
    }
  }

  isValidToComplete(): boolean {
    const isCanceled = this.data.status === 'CANCELED' || this.data.status === 'Cancelado';
    return (
      this.currentPayment >= 0 &&
      this.currentPayment <= this.data.client.debt &&
      this.data.status !== 'Entregado' &&
      !isCanceled
    );
  }

  onComplete(): void {
    if (!this.isValidToComplete()) return;

    this.deliveryService.completeDelivery(this.data.deliverId, this.currentPayment).subscribe({
      next: () => {
        this.dialogRef.close({
          action: 'complete',
          delivery: this.data
        });
        this.showSuccess('Reparto completado exitosamente');
      },
      error: (error) => {
        this.showError('Error al completar el reparto');
      }
    });
  }

  onClose(): void {
    this.dialogRef.close();
  }

  private calculateNextDeliveryDate(currentDate: string, frequency: number): string {
    const [datePart, timePart] = currentDate.split('T');
    const [day, month, year] = datePart.split('/');
    
    const date = new Date(+year, +month - 1, +day);
    date.setDate(date.getDate() + frequency);
    
    const nextDay = date.getDate().toString().padStart(2, '0');
    const nextMonth = (date.getMonth() + 1).toString().padStart(2, '0');
    const nextYear = date.getFullYear();
    
    return `${nextDay}/${nextMonth}/${nextYear}T${timePart}`;
  }

  private showSuccess(message: string): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: 3000,
      panelClass: ['success-snackbar']
    });
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: 3000,
      panelClass: ['error-snackbar']
    });
  }

  showPaymentDialog(): void {
    if (this.isDelivered) {
      const message = this.data.status.toUpperCase().includes('CANCEL') 
        ? 'No se pueden realizar cambios en un reparto cancelado'
        : 'No se pueden realizar cambios en un reparto ya entregado';
      this.showError(message);
      return;
    }

    const dialogRef = this.dialog.open(PaymentDialogComponent, {
      width: '300px',
      data: {
        title: 'Ingrese el monto a pagar',
        currentDebt: this.data.client.debt,
        currentPayment: this.currentPayment,
        clientName: this.data.client.name
      }
    });

    dialogRef.afterClosed().subscribe((result: number | undefined) => {
      if (result !== undefined) {
        this.currentPayment = result;
        this.onComplete();
      }
    });
  }

  onCancel(): void {
    if (this.isDelivered) {
      const message = this.data.status.toUpperCase().includes('CANCEL')
        ? 'El reparto ya está cancelado'
        : 'No se puede cancelar un reparto ya entregado';
      this.showError(message);
      return;
    }

    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '300px',
      data: {
        title: 'Cancelar Reparto',
        message: '¿Está seguro que desea cancelar este reparto?',
        confirmText: 'Sí, Cancelar',
        cancelText: 'No, Volver'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.deliveryService.cancelDelivery(this.data.deliverId).subscribe({
          next: () => {
            this.dialogRef.close({
              action: 'cancel',
              delivery: this.data
            });
            this.showSuccess('Reparto cancelado exitosamente');
          },
          error: (error) => {
            console.error('Error al cancelar el reparto:', error);
            this.showError('Error al cancelar el reparto');
          }
        });
      }
    });
  }

  formatDeliveryDateTime(dateTimeString: string): string {
    if (!dateTimeString) return '';
    
    try {
      const [datePart, timePart] = dateTimeString.split('T');
      const [day, month, year] = datePart.split('/');
      const date = new Date(+year, +month - 1, +day);
      
      if (isNaN(date.getTime())) {
        return '';
      }
      
      return `${datePart} ${timePart}`;
    } catch (error) {
      console.error('Error parsing date:', error);
      return '';
    }
  }

  formatDeliveryDate(dateTimeString: string): string {
    if (!dateTimeString) return '';
    
    try {
      // Parse the date string, assuming it's in format "dd/MM/yyyy'T'HH:mm"
      const [datePart] = dateTimeString.split('T');
      const [day, month, year] = datePart.split('/');
      const date = new Date(+year, +month - 1, +day);
      
      if (isNaN(date.getTime())) {
        return '';
      }
      
      return this.datePipe.transform(date, 'dd/MM/yyyy') || '';
    } catch (error) {
      console.error('Error parsing date:', error);
      return '';
    }
  }

  formatDeliveryTime(dateTimeString: string): string {
    if (!dateTimeString) return '';
    
    try {
      const [, timePart] = dateTimeString.split('T');
      if (!timePart) return '';
      
      return timePart;
    } catch (error) {
      console.error('Error parsing time:', error);
      return '';
    }
  }

  onEdit(): void {
    const dialogRef = this.dialog.open(ModalDeliveryComponent, {
      width: '800px',
      data: {
        isEdit: true,
        delivery: this.data
      },
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const formattedProducts = result.products.map((p: any) => ({
          product: {
            id: p.id,
            name: p.name,
            price: p.price
          },
          quantity: p.stock
        }));

        this.deliveryService.updateDeliveryAssignment(
          this.data.deliverId,
          result.assignedTo,
          result.client,
          result.status,
          result.deliveryDate,
          formattedProducts
        ).subscribe({
          next: (updatedDelivery) => {
            const mergedDelivery = {
              ...this.data,
              ...updatedDelivery,
              client: result.client,
              delivererEmail: result.assignedTo,
              deliveryDate: result.deliveryDate,
              status: result.status
            };

            this.dialogRef.close({
              action: 'edit',
              delivery: mergedDelivery
            });
            this.showSuccess('Reparto actualizado exitosamente');
          },
          error: (error) => {
            const errorMessage = error.message || 'Error al actualizar el reparto';
            this.showError(errorMessage);
            console.error('Error en la actualización:', error);
          }
        });
      }
    });
  }
}
