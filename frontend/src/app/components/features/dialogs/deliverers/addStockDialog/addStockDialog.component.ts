import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ProductService } from '../../../../../services/productService/product.service';
import { DelivererService } from '../../../../../services/delivererService/deliverer.service';
import { Product } from '../../../../../interfaces/product.interface';

@Component({
  selector: 'app-add-stock-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    ReactiveFormsModule
  ],
  templateUrl: './addStockDialog.component.html',
  styleUrls: ['./addStockDialog.component.css']
})
export class AddStockDialogComponent implements OnInit {
  stockForm: FormGroup;
  products: Product[] = [];

  constructor(
    private dialogRef: MatDialogRef<AddStockDialogComponent>,
    private formBuilder: FormBuilder,
    private productService: ProductService,
    private delivererService: DelivererService,
    private snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data: { deliverer: any }
  ) {
    this.stockForm = this.formBuilder.group({
      productId: ['', Validators.required],
      quantity: ['', [Validators.required, Validators.min(1)]]
    });
  }

  ngOnInit() {
    this.loadProducts();
  }

  loadProducts() {
    this.productService.getProducts().subscribe({
      next: (products) => {
        this.products = products;
      },
      error: (error) => {
        console.error('Error loading products:', error);
        this.snackBar.open('Error al cargar los productos', 'Cerrar', {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top'
        });
      }
    });
  }

  onSubmit() {
    if (this.stockForm.valid) {
      const { productId, quantity } = this.stockForm.value;
      
      this.delivererService.addStockToDeliverer(
        productId,
        quantity,
        this.data.deliverer.email
      ).subscribe({
        next: () => {
          this.snackBar.open('Stock agregado exitosamente', 'Cerrar', {
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'top'
          });
          this.dialogRef.close(true);
        },
        error: (error) => {
          console.error('Error adding stock:', error);
          this.snackBar.open('Error al agregar stock', 'Cerrar', {
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
} 