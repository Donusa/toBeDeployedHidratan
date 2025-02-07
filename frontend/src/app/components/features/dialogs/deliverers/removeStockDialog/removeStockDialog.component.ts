import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { DelivererService } from '../../../../../services/delivererService/deliverer.service';

@Component({
  selector: 'app-remove-stock-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    ReactiveFormsModule
  ],
  templateUrl: './removeStockDialog.component.html',
  styleUrls: ['./removeStockDialog.component.css']
})
export class RemoveStockDialogComponent {
  stockForm: FormGroup;

  constructor(
    private dialogRef: MatDialogRef<RemoveStockDialogComponent>,
    private formBuilder: FormBuilder,
    private delivererService: DelivererService,
    private snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data: { deliverer: any }
  ) {
    this.stockForm = this.formBuilder.group({
      productId: ['', Validators.required],
      quantity: ['', [Validators.required, Validators.min(1)]]
    });
  }

  onSubmit() {
    if (this.stockForm.valid) {
      const { productId, quantity } = this.stockForm.value;
      
      this.delivererService.removeStockFromDeliverer(
        productId,
        quantity,
        this.data.deliverer.email
      ).subscribe({
        next: () => {
          this.snackBar.open('Stock removido exitosamente', 'Cerrar', {
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'top'
          });
          this.dialogRef.close(true);
        },
        error: (error) => {
          console.error('Error removing stock:', error);
          this.snackBar.open('Error al remover stock', 'Cerrar', {
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'top'
          });
        }
      });
    }
  }

  onCancel() {
    this.dialogRef.close();
  }

  getMaxQuantity(): number {
    const selectedProductId = this.stockForm.get('productId')?.value;
    const selectedProduct = this.data.deliverer.products.find(
      (p: any) => p.product.id === selectedProductId
    );
    return selectedProduct?.quantity || 0;

  }

  onProductChange(): void {
    const maxQuantity = this.getMaxQuantity();
    this.stockForm.get('quantity')?.setValidators([
      Validators.required,
      Validators.min(1),
      Validators.max(maxQuantity)
    ]);
    this.stockForm.get('quantity')?.updateValueAndValidity();
  }

  hasAvailableProducts(): boolean {
    return this.data.deliverer.products?.some((stock: any) => stock.quantity > 0) ?? false;
  }
} 