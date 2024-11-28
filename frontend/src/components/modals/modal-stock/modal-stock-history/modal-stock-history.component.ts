import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

export interface StockHistory {
  date: Date;
  totalValue: number;
  productCount?: number;
  lowStockCount?: number;
  description?: string;
}

@Component({
  selector: 'app-modal-stock-history',
  templateUrl: './modal-stock-history.component.html',
  styleUrls: ['./modal-stock-history.component.css']
})
export class ModalStockHistoryComponent {
  displayedColumns: string[] = ['date', 'description', 'totalValue'];

  constructor(
    public dialogRef: MatDialogRef<ModalStockHistoryComponent>,
    @Inject(MAT_DIALOG_DATA) public data: StockHistory[]
  ) {}

  onClose(): void {
    this.dialogRef.close();
  }

  getTotalIncome(): number {
    return this.data.reduce((total, record) => total + record.totalValue, 0);
  }
}
