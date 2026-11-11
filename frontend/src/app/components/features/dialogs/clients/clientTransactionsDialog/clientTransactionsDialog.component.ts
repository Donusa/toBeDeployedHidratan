import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog, MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { filter, finalize, switchMap } from 'rxjs';
import { AuthenticationService } from '../../../../../services/authentication.service';
import { ClientService } from '../../../../../services/clientService/client.service';
import { ConfirmDialogComponent } from '../../../../shared/confirmDialog/confirmDialog.component';
import { ClientTransaction, ClientTransactionGroup, groupClientTransactions } from './clientTransactionHistory';

@Component({
  selector: 'app-client-transactions-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule, MatExpansionModule],
  templateUrl: './clientTransactionsDialog.component.html',
  styleUrl: './clientTransactionsDialog.component.css'
})
export class ClientTransactionsDialogComponent implements OnInit {
  transactionGroups: ClientTransactionGroup[] = [];
  readonly isAdmin: boolean;
  isDeleting = false;

  constructor(
    private dialogRef: MatDialogRef<ClientTransactionsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { clientId: number; client: any },
    private clientService: ClientService,
    authService: AuthenticationService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    this.isAdmin = authService.isAdmin();
  }

  ngOnInit(): void {
    this.clientService.getClientTransactions(this.data.clientId).subscribe({
      next: tx => this.transactionGroups = groupClientTransactions(tx)
    });
  }

  close(): void {
    this.dialogRef.close();
  }

  deleteHistoryEntry(group: ClientTransactionGroup): void {
    const transactionId = group.events[0].id;
    if (!this.isAdmin || this.isDeleting || transactionId == null) return;

    this.isDeleting = true;
    this.dialog.open(ConfirmDialogComponent, {
      width: '420px',
      data: {
        title: 'Eliminar registro del historial',
        message: `¿Deseas eliminar «${this.formatGroup(group)}» del historial? La carga original se conserva.`,
        confirmText: 'Eliminar',
        color: 'warn',
        icon: 'delete'
      }
    }).afterClosed().pipe(
      filter(confirmed => confirmed === true),
      switchMap(() => this.clientService.deleteClientHistoryEntry(this.data.clientId, transactionId)),
      finalize(() => this.isDeleting = false)
    ).subscribe({
      next: () => {
        this.transactionGroups = this.transactionGroups.filter(entry => entry.key !== group.key);
        this.snackBar.open('Registro eliminado del historial', 'Cerrar', { duration: 3000 });
      },
      error: () => {
        this.snackBar.open('No se pudo eliminar el registro del historial', 'Cerrar', { duration: 3000 });
      }
    });
  }

  formatGroup(group: ClientTransactionGroup): string {
    if (!group.isVisit) return this.formatType(group.events[0]);
    const label = group.deliveryId != null ? `Visita #${group.deliveryId}` : 'Reparto';
    const count = group.events.length;
    return `${label} · ${count} ${count === 1 ? 'movimiento' : 'movimientos'}`;
  }

  formatType(transaction: ClientTransaction): string {
    switch (transaction.type) {
      case 'MONETARY_PAYMENT': return (transaction.amount ?? 0) < 0 ? 'Deuda' : 'Pago';
      case 'MONETARY_DEBT_UPDATE': return 'Deuda';
      case 'PRODUCT_DELIVERY': return 'Entrega de producto';
      case 'PRODUCT_RETURN': return 'Devolución de producto';
      default: return transaction.type;
    }
  }

  displayAmount(transaction: ClientTransaction): number | null {
    if (transaction.amount !== null &&
        (transaction.type === 'MONETARY_PAYMENT' || transaction.type === 'MONETARY_DEBT_UPDATE')) {
      return Math.abs(transaction.amount);
    }
    return transaction.amount;
  }
}
