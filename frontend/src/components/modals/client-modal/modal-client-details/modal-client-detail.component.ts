import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { AuthenticationService } from 'src/app/services/authenticationService.service';
import { DeliveryService } from 'src/app/services/deliveryService/delivery-service';

@Component({
  selector: 'app-modal-client-detail',
  templateUrl: './modal-client-detail.component.html',
  styleUrls: ['./modal-client-detail.component.css']
})
export class ModalClientDetailComponent implements OnInit {
  isAdmin: boolean = false;
  clientProducts: any[] = [];
  clientStock: any[] = [];

  constructor(
    public dialogRef: MatDialogRef<ModalClientDetailComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private authService: AuthenticationService,
    private deliveryService: DeliveryService
  ) {
    this.isAdmin = this.authService.isAdmin();
  }

  ngOnInit() {
    this.loadClientProducts();
  }

  loadClientProducts() {
    this.deliveryService.getDeliveries().subscribe({
      next: (deliveries) => {
        const activeDelivery = deliveries.find(d => 
          d.client.name === this.data.name && 
          d.client.address === this.data.address &&
          d.status === 'Pendiente'
        );
        
        if (activeDelivery && activeDelivery.client.clientProducts) {
          this.clientProducts = activeDelivery.client.clientProducts.map(product => ({
            name: product.product.name,
            stock: product.quantity
          }));
        } else {
          this.clientProducts = [];
        }
      },
      error: (error) => {
        console.error('Error loading client products:', error);
        this.clientProducts = [];
      }
    });
  }

  onClose(): void {
    this.dialogRef.close();
  }

  onEdit(): void {
    this.dialogRef.close({
      action: 'edit',
      client: this.data
    });
  }

  onDelete(): void {
    this.dialogRef.close({ action: 'delete', client: this.data });
  }

  parseDate(dateString: string): Date {
    // Convert "DD/MM/YYYYTHH:mm" to "YYYY-MM-DDTHH:mm"
    const [datePart, timePart] = dateString.split('T');
    const [day, month, year] = datePart.split('/');
    return new Date(`${year}-${month}-${day}T${timePart}`);
  }
}