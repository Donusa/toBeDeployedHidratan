import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ClientService } from '../../../../../services/clientService/client.service';

@Component({
  selector: 'app-client-transactions-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatTableModule, MatButtonModule, MatIconModule, MatExpansionModule],
  templateUrl: './clientTransactionsDialog.component.html',
  styleUrl: './clientTransactionsDialog.component.css'
})
export class ClientTransactionsDialogComponent implements OnInit {
  transactions: any[] = [];
  displayedColumns = ['date','type','product','quantity','amount','debtBefore','debtAfter'];
  isMobile = window.innerWidth <= 576;

  constructor(
    private dialogRef: MatDialogRef<ClientTransactionsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { clientId: number; client: any },
    private clientService: ClientService
  ) {}

  ngOnInit(): void {
    this.clientService.getClientTransactions(this.data.clientId).subscribe({
      next: tx => this.transactions = tx
    });
  }

  close(): void {
    this.dialogRef.close();
  }

  formatType(t: string): string {
    switch (t) {
      case 'MONETARY_PAYMENT': return 'Pago';
      case 'MONETARY_DEBT_UPDATE': return 'Actualización de deuda';
      case 'PRODUCT_DELIVERY': return 'Entrega de producto';
      case 'PRODUCT_RETURN': return 'Devolución de producto';
      default: return t;
    }
  }
}
