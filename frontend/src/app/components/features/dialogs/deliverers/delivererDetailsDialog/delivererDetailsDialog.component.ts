import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatSnackBar } from '@angular/material/snack-bar';
import { VisitService } from '../../../../../services/visitService/visit.service';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { AppUserResponse } from '../../../../../interfaces/appUserResponse.interface';
import { AddStockDialogComponent } from '../addStockDialog/addStockDialog.component';
import { Deliverer } from '../../../../../interfaces/deliverer.interface';

@Component({
  selector: 'app-deliverer-details-dialog',
  templateUrl: './delivererDetailsDialog.component.html',
  styleUrls: ['./delivererDetailsDialog.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule
  ]
})
export class DelivererDetailsDialogComponent {
  displayedColumns: string[] = ['product', 'quantity'];

  constructor(
    private dialogRef: MatDialogRef<DelivererDetailsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Deliverer,
    private visitService: VisitService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  private getStatusLabel(status: string): string {
    const statusMap: { [key: string]: string } = {
      'PENDING': 'Pendiente',
      'IN_PROGRESS': 'En Progreso',
      'COMPLETED': 'Completado',
      'CANCELLED': 'Cancelado'
    };
    return statusMap[status] || status;
  }

  onDownload(): void {
    this.dialogRef.close({ action: 'download', deliverer: this.data });
  }

  onClose(): void {
    this.dialogRef.close();
  }

  openAddStockDialog(): void {
    const dialogRef = this.dialog.open(AddStockDialogComponent, {
      width: '600px',
      data: this.data
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
      
      }
    });
  }
} 