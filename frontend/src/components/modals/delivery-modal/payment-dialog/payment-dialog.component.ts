import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { CommonModule } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-payment-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule
  ],
  template: `
    <h2 mat-dialog-title>{{data.title}}</h2>
    <mat-dialog-content>
      <div class="payment-info">
        <p>Deuda actual del cliente: {{data.currentDebt | currency:'ARS':'symbol-narrow'}}</p>
        <mat-form-field appearance="outline">
          <mat-label>Monto a pagar</mat-label>
          <input matInput 
                 type="number" 
                 [(ngModel)]="payment" 
                 (ngModelChange)="onPaymentChange($event)"
                 min="0" 
                 [max]="data.currentDebt">
          <span matPrefix>$&nbsp;</span>
          <mat-error *ngIf="payment > data.currentDebt">
            El pago no puede ser mayor a la deuda
          </mat-error>
        </mat-form-field>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Cancelar</button>
      <button mat-raised-button 
              color="primary" 
              [disabled]="!isValidPayment()"
              (click)="onConfirm()">
        Confirmar
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .payment-info {
      padding: 20px 0;
    }
    .mat-form-field {
      width: 100%;
    }
    .warning-dialog {
      .mat-dialog-title {
        color: #f44336;
      }

      .mat-dialog-content {
        padding: 20px 0;
      }

      .mat-dialog-actions {
        justify-content: flex-end;
      }
    }
    .warning-snackbar {
      background: #ff9800;
      color: white;
      z-index: 100000 !important;
    }

    .warning-snackbar .mat-simple-snackbar-action {
      color: white;
    }
  `]
})
export class PaymentDialogComponent {
  payment: number = 0;

  constructor(
    public dialogRef: MatDialogRef<PaymentDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: {
      title: string;
      currentDebt: number;
      currentPayment: number;
      clientName: string;
    },
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    this.payment = data.currentPayment;
  }

  onPaymentChange(value: number): void {
    if (value > this.data.currentDebt) {
      this.snackBar.open('El monto ingresado supera la deuda actual', 'Entendido', {
        duration: 5000,
        verticalPosition: 'top',
        horizontalPosition: 'center',
        panelClass: ['warning-snackbar']
      });
      this.payment = this.data.currentDebt;
    }
  }

  isValidPayment(): boolean {
    return this.payment >= 0 && this.payment <= this.data.currentDebt;
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onConfirm(): void {
    if (this.isValidPayment()) {
      this.dialogRef.close(this.payment);
    }
  }
} 