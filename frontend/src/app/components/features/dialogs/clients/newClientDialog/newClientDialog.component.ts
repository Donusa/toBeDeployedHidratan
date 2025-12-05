import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { ProductService } from '../../../../../services/productService/product.service';
import { Product } from '../../../../../interfaces/product.interface';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-new-client-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatSelectModule,
    MatTableModule,
    MatIconModule
  ],
  templateUrl: './newClientDialog.component.html',
  styleUrl: './newClientDialog.component.css'
})
export class NewClientDialogComponent implements OnInit {
  clientForm: FormGroup;
  addForm: FormGroup;
  initialStock: { productId: number; product?: Product; quantity: number }[] = [];
  products: Product[] = [];

  constructor(
    private dialogRef: MatDialogRef<NewClientDialogComponent>,
    private fb: FormBuilder,
    private productService: ProductService
  ) {
    this.clientForm = this.fb.group({
      address: ['', Validators.required],
      phoneNumber: ['', [Validators.required, Validators.pattern(/^(?:(?:00)?549?)?0?(?:11|[2368]\d)(?:(?=\d{0,2}15)\d{2})??\d{8}$/)]],
      frecuency: [0, [Validators.required, Validators.min(1)]],
      debt: [0, [Validators.required]],
      zone: [''],
      observations: ['']
    });

    this.addForm = this.fb.group({
      productId: [null, Validators.required],
      quantity: [1, [Validators.required, Validators.min(1)]]
    });
  }

  ngOnInit(): void {
    this.productService.getProducts().subscribe({
      next: (p) => this.products = p
    });
  }

  onSubmit(): void {
    if (this.clientForm.valid) {
      const payload = {
        ...this.clientForm.value,
        initialStock: this.initialStock.map(s => ({ productId: s.productId, quantity: s.quantity }))
      };
      this.dialogRef.close(payload);
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  addInitialProduct(): void {
    const productId = Number(this.addForm.get('productId')?.value);
    const quantity = Number(this.addForm.get('quantity')?.value);
    if (!productId || !quantity) return;
    const product = this.products.find(p => p.id === productId) || undefined;
    const existing = this.initialStock.find(s => s.productId === productId);
    if (existing) {
      existing.quantity += quantity;
    } else {
      this.initialStock.push({ productId, product, quantity });
    }
    this.initialStock = [...this.initialStock];
    this.addForm.reset({ productId: null, quantity: 1 });
  }

  removeInitialProduct(productId: number): void {
    this.initialStock = this.initialStock.filter(s => s.productId !== productId);
  }
}
