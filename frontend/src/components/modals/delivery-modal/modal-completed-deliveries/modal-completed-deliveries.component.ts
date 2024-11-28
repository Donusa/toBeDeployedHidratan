import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { DeliveryViewResponse } from 'src/interfaces/DeliveryViewResponse.interface';
import { DatePipe } from '@angular/common';
import { ModalDeliveryDetailComponent } from '../modal-delivery-detail/modal-delivery-detail.component';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-modal-completed-deliveries',
  templateUrl: './modal-completed-deliveries.component.html',
  standalone: true,
  imports: [
    CommonModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatDialogModule
  ],
  providers: [DatePipe]
})
export class ModalCompletedDeliveriesComponent {
  constructor(
    public dialogRef: MatDialogRef<ModalCompletedDeliveriesComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { deliveries: DeliveryViewResponse[] },
    private datePipe: DatePipe,
    private dialog: MatDialog
  ) {}

  formatDeliveryDateTime(date: string): string {
    if (!date) return '';
    const [datePart, timePart] = date.split('T');
    return `${datePart} ${timePart}`;
  }

  openDeliveryDetail(delivery: DeliveryViewResponse): void {
    this.dialogRef.close();
    this.dialog.open(ModalDeliveryDetailComponent, {
      width: '600px',
      data: delivery
    });
  }

  onClose(): void {
    this.dialogRef.close();
  }
}