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
    public dialogRef: MatDialogRef<DelivererDetailsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AppUserResponse,
    private visitService: VisitService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  downloadDeliveries(): void {
    this.visitService.getDeliveriesToday(this.data.email).subscribe({
      next: (deliveries) => {
        if (deliveries.length === 0) {
          this.snackBar.open('El repartidor no tiene entregas asignadas para hoy', 'Cerrar', {
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'top'
          });
          return;
        }

        const doc = new jsPDF();
        doc.text(`Entregas del día - ${this.data.name}`, 14, 16);

        const columns = [
          'ID', 
          'Fecha', 
          'Estado', 
          'Cliente', 
          'Dirección', 
          'Producto', 
          'Cantidad'
        ];
        
        const rows = deliveries.flatMap(delivery => 
          delivery.products.map((product: any) => [
            delivery.id,
            delivery.date.split('T')[0],
            this.getStatusLabel(delivery.status),
            delivery.clientName,
            delivery.address,
            product.name,
            product.quantity
          ])
        );

        (doc as any).autoTable({
          head: [columns],
          body: rows,
          startY: 25,
          theme: 'grid',
          styles: { fontSize: 8 },
          headStyles: { fillColor: [66, 66, 66] }
        });

        const fileName = `entregas-${this.data.name}-${new Date().toISOString().split('T')[0]}.pdf`;
        doc.save(fileName);
      },
      error: (error) => {
        console.error('Error fetching deliveries:', error);
        this.snackBar.open('Error al obtener las entregas', 'Cerrar', {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top'
        });
      }
    });
  }

  private getStatusLabel(status: string): string {
    const statusMap: { [key: string]: string } = {
      'PENDING': 'Pendiente',
      'IN_PROGRESS': 'En Progreso',
      'COMPLETED': 'Completado',
      'CANCELLED': 'Cancelado'
    };
    return statusMap[status] || status;
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