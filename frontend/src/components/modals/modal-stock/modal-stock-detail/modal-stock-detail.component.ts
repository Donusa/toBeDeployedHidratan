import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { AuthenticationService } from 'src/app/services/authenticationService.service';
import { Product } from '../../../../interfaces/product.interface';

@Component({
  selector: 'app-modal-stock-detail',
  templateUrl: './modal-stock-detail.component.html',
  styleUrls: ['./modal-stock-detail.component.css']
})
export class ModalStockDetailComponent {
  isAdmin: boolean = false;

  constructor(
    private authService: AuthenticationService,
    public dialogRef: MatDialogRef<ModalStockDetailComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Product
  ) {
    this.isAdmin = this.authService.isAdmin();
  }

  onClose(): void {
    this.dialogRef.close();
  }

  onEdit(): void {
    this.dialogRef.close({
      action: 'edit',
      product: this.data
    });
  }
}
