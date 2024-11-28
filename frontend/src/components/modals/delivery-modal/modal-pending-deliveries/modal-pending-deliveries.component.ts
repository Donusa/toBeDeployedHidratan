import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DeliveryViewResponse } from 'src/interfaces/DeliveryViewResponse.interface';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-modal-pending-deliveries',
  templateUrl: './modal-pending-deliveries.component.html',
  styleUrls: ['./modal-pending-deliveries.component.css'],
  providers: [DatePipe]
})
export class ModalPendingDeliveriesComponent {
  constructor(
    public dialogRef: MatDialogRef<ModalPendingDeliveriesComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { deliveries: DeliveryViewResponse[] },
    private datePipe: DatePipe
  ) {}

  formatDeliveryDateTime(dateTimeString: string): string {
    if (!dateTimeString) return '';
    
    try {
      const [datePart, timePart] = dateTimeString.split('T');
      if (!datePart || !timePart) return '';
      
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

  onClose(): void {
    this.dialogRef.close();
  }
} 