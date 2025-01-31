import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Product } from '../../../../../interfaces/product.interface';
import { ProductService } from '../../../../../services/productService/product.service';

@Component({
  selector: 'app-edit-product-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    ReactiveFormsModule
  ],
  templateUrl: './editProductDialog.component.html',
  styleUrl: './editProductDialog.component.css'
})
export class EditProductDialogComponent {
  productForm: FormGroup;

  constructor(
    private dialogRef: MatDialogRef<EditProductDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Product,
    private formBuilder: FormBuilder,
    private productService: ProductService,
    private snackBar: MatSnackBar
  ) {
    this.productForm = this.formBuilder.group({
      name: [data.name, [Validators.required]],
      price: [data.price, [Validators.required, Validators.min(0)]],
      returnable: [data.returnable]
    });
  }

  onSubmit(): void {
    if (this.productForm.valid) {
      const updatedProduct = {
        ...this.productForm.value,
        id: this.data.id
      };

      this.productService.updateProduct(this.data.id, updatedProduct).subscribe({
        next: () => {
          this.snackBar.open('Producto actualizado exitosamente', 'Cerrar', {
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'top'
          });
          this.dialogRef.close(true);
        },
        error: (error) => {
          console.error('Error updating product:', error);
          this.snackBar.open('Error al actualizar el producto', 'Cerrar', {
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'top'
          });
        }
      });
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
} 