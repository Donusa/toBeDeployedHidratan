import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Client } from '../../../../../interfaces/client.interface';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { Product } from '../../../../../interfaces/product.interface';
import { ProductService } from '../../../../../services/productService/product.service';
import { ClientService } from '../../../../../services/clientService/client.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { forkJoin, of, Observable } from 'rxjs';

@Component({
  selector: 'app-edit-client-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
    MatSelectModule,
    MatTableModule
  ],
  templateUrl: './editClientDialog.component.html',
  styleUrl: './editClientDialog.component.css'
})
export class EditClientDialogComponent implements OnInit {
  clientForm: FormGroup;
  addForm: FormGroup;
  removeForm: FormGroup;
  availableProducts: Product[] = [];
  clientStock: any[] = [];
  stockForm: FormGroup;
  originalStock = new Map<number, number>();

  constructor(
    public dialogRef: MatDialogRef<EditClientDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public client: Client,
    private fb: FormBuilder,
    private productService: ProductService,
    private clientService: ClientService,
    private snackBar: MatSnackBar
  ) {
    this.clientForm = this.fb.group({
      address: [client.address, Validators.required],
      phoneNumber: [client.phoneNumber, [Validators.required, Validators.pattern('^[0-9]{10}$')]],
      frecuency: [client.frecuency, [Validators.required, Validators.min(1)]],
      debt: [client.debt, [Validators.required]],
      zone: [client.zone],
      observations: [client.observations]
    });

    this.addForm = this.fb.group({
      productId: [null, Validators.required],
      quantity: [1, [Validators.required, Validators.min(1)]]
    });

    this.removeForm = this.fb.group({
      productId: [null, Validators.required],
      quantity: [1, [Validators.required, Validators.min(1)]]
    });

    this.stockForm = this.fb.group({});
  }

  ngOnInit(): void {
    if (this.client && Array.isArray(this.client.clientStock)) {
      this.clientStock = this.client.clientStock.map(s => ({ product: s.product, quantity: s.quantity }));
      this.client.clientStock.forEach(s => this.originalStock.set(s.product.id, s.quantity));
      this.rebuildStockForm();
    }
    this.productService.getProducts().subscribe({
      next: (products) => this.availableProducts = products
    });
  }

  onSubmit(): void {
    if (this.clientForm.valid) {
      const updatedClient: Client = {
        ...this.client,
        ...this.clientForm.value
      };
      const ops: any[] = [];
      const currentKeys = Object.keys(this.stockForm.controls).map(k => Number(k));
      const allKeys = new Set<number>([...currentKeys, ...Array.from(this.originalStock.keys())]);
      allKeys.forEach(pid => {
        const newQty = Number(this.stockForm.get(pid.toString())?.value ?? 0);
        const origQty = this.originalStock.get(pid) ?? 0;
        if (isNaN(newQty) || newQty < 0) return;
        if (newQty > origQty) {
          const delta = newQty - origQty;
          ops.push(this.clientService.addClientStock(this.client.id, pid, delta));
        } else if (newQty < origQty) {
          const delta = origQty - newQty;
          ops.push(this.clientService.removeClientStock(this.client.id, pid, delta));
        }
      });

      const exec$: Observable<unknown> = ops.length ? forkJoin(ops) : of(null);
      exec$.subscribe({
        next: () => this.dialogRef.close(updatedClient),
        error: () => {
          this.snackBar.open('Error al actualizar stock', 'Cerrar', { duration: 3000, panelClass: ['error-snackbar'] });
        }
      });
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onAddProduct(): void {
    const productId = this.addForm.get('productId')?.value;
    const quantity = this.addForm.get('quantity')?.value;
    if (!productId || !quantity) return;
    const product = this.availableProducts.find(p => p.id === productId);
    if (!product) return;
    const existing = this.clientStock.find(s => s.product.id === productId);
    if (existing) {
      existing.quantity = Number(existing.quantity) + Number(quantity);
    } else {
      this.clientStock.push({ product, quantity: Number(quantity) });
    }
    this.clientStock = [...this.clientStock];
    this.rebuildStockForm();
    this.addForm.reset({ productId: null, quantity: 1 });
  }

  onRemoveProduct(): void {
    const productId = this.removeForm.get('productId')?.value;
    const quantity = this.removeForm.get('quantity')?.value;
    if (!productId || !quantity) return;
    this.clientService.removeClientStock(this.client.id, productId, quantity).subscribe({
      next: () => {
        this.clientService.getClientStock(this.client.id).subscribe({
          next: (stock) => {
            this.clientStock = stock.map(s => ({ product: s.product, quantity: s.quantity }));
            this.rebuildStockForm();
          }
        });
        this.snackBar.open('Producto removido', 'Cerrar', { duration: 2000 });
        this.removeForm.reset({ productId: null, quantity: 1 });
      },
      error: () => {
        this.snackBar.open('Error al remover producto', 'Cerrar', { duration: 3000, panelClass: ['error-snackbar'] });
      }
    });
  }

  rebuildStockForm(): void {
    const group: { [key: string]: any } = {};
    this.clientStock.forEach(s => {
      const key = s.product.id.toString();
      group[key] = [s.quantity, [Validators.min(0)]];
    });
    this.stockForm = this.fb.group(group);
  }

  onUpdateQuantity(productId: number): void {
    const control = this.stockForm.get(productId.toString());
    if (!control) return;
    let newQty = Number(control.value || 0);
    if (isNaN(newQty) || newQty < 0) newQty = 0;
    const current = this.clientStock.find(s => s.product.id === productId)?.quantity || 0;
    if (newQty === current) return;
    if (newQty > current) {
      const delta = newQty - current;
      this.clientService.addClientStock(this.client.id, productId, delta).subscribe({
        next: () => {
          this.clientService.getClientStock(this.client.id).subscribe({
            next: (stock) => {
              this.clientStock = stock.map(s => ({ product: s.product, quantity: s.quantity }));
              this.rebuildStockForm();
            }
          });
          this.snackBar.open('Cantidad actualizada', 'Cerrar', { duration: 2000 });
        },
        error: () => {
          this.snackBar.open('Error al actualizar cantidad', 'Cerrar', { duration: 3000, panelClass: ['error-snackbar'] });
        }
      });
    } else {
      const delta = current - newQty;
      if (delta <= 0) return;
      this.clientService.removeClientStock(this.client.id, productId, delta).subscribe({
        next: () => {
          this.clientService.getClientStock(this.client.id).subscribe({
            next: (stock) => {
              this.clientStock = stock.map(s => ({ product: s.product, quantity: s.quantity }));
              this.rebuildStockForm();
            }
          });
          this.snackBar.open('Cantidad actualizada', 'Cerrar', { duration: 2000 });
        },
        error: () => {
          this.snackBar.open('Error al actualizar cantidad', 'Cerrar', { duration: 3000, panelClass: ['error-snackbar'] });
        }
      });
    }
  }

  onRemoveProductAll(productId: number): void {
    const idx = this.clientStock.findIndex(s => s.product.id === productId);
    if (idx === -1) return;
    this.clientStock.splice(idx, 1);
    this.clientStock = [...this.clientStock];
    this.stockForm.removeControl(productId.toString());
  }
}
