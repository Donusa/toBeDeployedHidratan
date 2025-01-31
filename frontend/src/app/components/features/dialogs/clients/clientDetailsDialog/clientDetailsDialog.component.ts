import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { Client, ClientStock } from '../../../../../interfaces/client.interface';
import { EditClientDialogComponent } from '../editClientDialog/editClientDialog.component';
import { ClientService } from '../../../../../services/clientService/client.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthenticationService } from '../../../../../services/authentication.service';

@Component({
  selector: 'app-client-details-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule
  ],
  templateUrl: './clientDetailsDialog.component.html',
  styleUrl: './clientDetailsDialog.component.css'
})
export class ClientDetailsDialogComponent {
  displayedColumns: string[] = ['product', 'quantity'];
  clientStock: ClientStock[] = [];
  isAdmin = false;

  constructor(
    public dialogRef: MatDialogRef<ClientDetailsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public client: Client,
    private dialog: MatDialog,
    private clientService: ClientService,
    private snackBar: MatSnackBar,
    private authService: AuthenticationService
  ) {
    this.isAdmin = this.authService.isAdmin();
    
    if (client && client.clientStock) {
      this.clientStock = client.clientStock.map(stock => ({
        id: stock.id,
        product: stock.product,
        quantity: stock.quantity
      }));
    }
  }

  onClose(): void {
    this.dialogRef.close();
  }

  onEdit(): void {
    const editDialogRef = this.dialog.open(EditClientDialogComponent, {
      width: '500px',
      data: this.client
    });

    editDialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.clientService.updateClient(result).subscribe({
          next: (updatedClient) => {
            this.client = updatedClient;
            this.snackBar.open('Cliente actualizado exitosamente', 'Cerrar', {
              duration: 3000
            });
            this.dialogRef.close(updatedClient);
          },
          error: (error) => {
            this.snackBar.open('Error al actualizar el cliente', 'Cerrar', {
              duration: 3000,
              panelClass: ['error-snackbar']
            });
          }
        });
      }
    });
  }

  getTotalStock(): number {
    return this.clientStock.reduce((total, stock) => total + stock.quantity, 0);
  }
}
