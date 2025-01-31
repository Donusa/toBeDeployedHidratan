import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { Inject } from '@angular/core';
import { Product } from '../../../../../interfaces/product.interface';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthenticationService } from '../../../../../services/authentication.service';

@Component({
  selector: 'app-product-details-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule
  ],
  templateUrl: './productDetailsDialog.component.html',
  styleUrl: './productDetailsDialog.component.css'
})
export class ProductDetailsDialogComponent {
  isAdmin = false;

  constructor(
    public dialogRef: MatDialogRef<ProductDetailsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Product,
    private snackBar: MatSnackBar,
    private authService: AuthenticationService
  ) {
    this.isAdmin = this.authService.isAdmin();
  }

  onClose(): void {
    this.dialogRef.close();
  }

  onEdit(): void {
    this.dialogRef.close('edit');
  }
} 