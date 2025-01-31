import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

interface AddProductDialogData {
  availableProducts: any[];
  clientId: number;
  type: 'delivery' | 'return';
}

@Component({
  selector: 'app-add-product-to-visit-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule
  ],
  templateUrl: './addProductToVisitDialog.component.html',
  styleUrls: ['./addProductToVisitDialog.component.css']
})
export class AddProductToVisitDialogComponent {
  productForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<AddProductToVisitDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AddProductDialogData
  ) {
    this.productForm = this.fb.group({
      productId: ['', Validators.required],
      quantity: ['', [Validators.required, Validators.min(1)]]
    });

    this.productForm.get('productId')?.valueChanges.subscribe(productId => {
      const maxQuantity = this.getMaxQuantity();
      this.productForm.get('quantity')?.setValidators([
        Validators.required,
        Validators.min(1),
        Validators.max(maxQuantity)
      ]);
      this.productForm.get('quantity')?.updateValueAndValidity();
    });
  }

  getMaxQuantity(): number {
    const productId = this.productForm.get('productId')?.value;
    const selectedStock = this.data.availableProducts.find(
      stock => stock.product.id === productId
    );
    return selectedStock?.quantity || 0;
  }

  onSubmit() {
    if (this.productForm.valid) {
      const selectedProduct = this.data.availableProducts.find(
        p => p.product.id === this.productForm.value.productId
      );
      
      this.dialogRef.close({
        product: selectedProduct?.product,  
        quantity: this.productForm.value.quantity
      });
    }
  }

  onClose() {
    this.dialogRef.close();
  }
} 