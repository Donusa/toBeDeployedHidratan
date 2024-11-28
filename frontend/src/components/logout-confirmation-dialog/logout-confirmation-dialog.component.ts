import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-logout-confirmation-dialog',
  template: `
    <h2 mat-dialog-title>Confirmación</h2>
    <mat-dialog-content>
      <p>Se han guardado los cambios. Por favor, inicie sesión nuevamente.</p>
    </mat-dialog-content>
    <mat-dialog-actions>
      <button mat-button (click)="onConfirm()">Aceptar</button>
    </mat-dialog-actions>
  `
})
export class LogoutConfirmationDialogComponent {
  constructor(private dialogRef: MatDialogRef<LogoutConfirmationDialogComponent>) {}

  onConfirm(): void {
    this.dialogRef.close(true);
  }
}