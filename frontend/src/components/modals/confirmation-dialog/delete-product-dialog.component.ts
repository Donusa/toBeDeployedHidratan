import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-delete-product-dialog',
  template: `
    <h2 mat-dialog-title>{{data.action === 'activar' ? 'Activar' : 'Dar de Baja'}} Repartidor</h2>
    <mat-dialog-content>
      <div *ngIf="step === 1">
        <p>¿Está seguro que desea {{data.action}} a este repartidor?</p>
        <p><strong>{{data.name}}</strong></p>
      </div>
      
      <div *ngIf="step === 2">
        <p>Por favor, escriba el nombre del repartidor para confirmar:</p>
        <form [formGroup]="confirmForm">
          <mat-form-field appearance="outline">
            <mat-label>Nombre del repartidor</mat-label>
            <input matInput formControlName="productName">
          </mat-form-field>
        </form>
      </div>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Cancelar</button>
      <button mat-raised-button 
              [color]="data.action === 'activar' ? 'primary' : 'warn'"
              (click)="onConfirm()"
              [disabled]="step === 2 && confirmForm.get('productName')?.value !== data.name">
        Confirmar
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    mat-form-field {
      width: 100%;
    }
  `]
})
export class DeleteProductDialogComponent {
  step: number = 1;
  confirmForm: FormGroup;

  constructor(
    private dialogRef: MatDialogRef<DeleteProductDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private fb: FormBuilder
  ) {
    this.confirmForm = this.fb.group({
      productName: ['', Validators.required]
    });
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }

  onConfirm(): void {
    if (this.step === 1) {
      this.step = 2;
    } else {
      this.dialogRef.close(true);
    }
  }
} 