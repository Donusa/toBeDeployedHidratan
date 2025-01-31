import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule, Location, DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';
import { AuthenticationService } from '../../../../services/authentication.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Deliverer } from '../../../../interfaces/deliverer.interface';
import { DelivererService } from '../../../../services/delivererService/deliverer.service';
import { NewDelivererDialogComponent } from '../../dialogs/deliverers/newDelivererDialog/newDelivererDialog.component';
import { EditDelivererDialogComponent } from '../../dialogs/deliverers/editDelivererDialog/editDelivererDialog.component';
import { DelivererDetailsDialogComponent } from '../../dialogs/deliverers/delivererDetailsDialog/delivererDetailsDialog.component';
import { AddStockDialogComponent } from '../../dialogs/deliverers/addStockDialog/addStockDialog.component';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { VisitService } from '../../../../services/visitService/visit.service';
import { ClientService } from '../../../../services/clientService/client.service';

@Component({
  selector: 'app-deliverer',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatPaginatorModule,
    MatInputModule,
    MatFormFieldModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatMenuModule
  ],
  templateUrl: './deliverer.component.html',
  styleUrl: './deliverer.component.css',
  providers: [DatePipe]
})
export class DelivererComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = ['name', 'email', 'status', 'actions'];
  dataSource: MatTableDataSource<Deliverer>;
  isLoading = true;
  isAdmin: boolean = false;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private router: Router,
    private location: Location,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private datePipe: DatePipe,
    private authenticationService: AuthenticationService,
    private delivererService: DelivererService,
    private visitService: VisitService,
    private clientService: ClientService
  ) {
    this.dataSource = new MatTableDataSource<Deliverer>([]);
    this.isAdmin = this.authenticationService.isAdmin();
  }

  ngOnInit() {
    this.loadDeliverers();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    
    this.dataSource.filterPredicate = (data: Deliverer, filter: string) => {
      return data.name.toLowerCase().includes(filter) ||
             data.email.toLowerCase().includes(filter);
    };
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  goBack(): void {
    this.location.back();
  }

  loadDeliverers(): void {
    this.isLoading = true;
    this.delivererService.getDeliverers().subscribe({
      next: (deliverers) => {
        this.dataSource = new MatTableDataSource(deliverers);
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading deliverers:', error);
        this.snackBar.open('Error al cargar los repartidores', 'Cerrar', {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top'
        });
        this.isLoading = false;
      }
    });
  }

  openNewDelivererDialog(): void {
    const dialogRef = this.dialog.open(NewDelivererDialogComponent, {
      width: '600px'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadDeliverers();
      }
    });
  }

  openEditDelivererDialog(deliverer: Deliverer): void {
    const dialogRef = this.dialog.open(EditDelivererDialogComponent, {
      width: '600px',
      data: deliverer
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadDeliverers();
      }
    });
  }

  openDelivererDetailsDialog(deliverer: Deliverer): void {
    this.dialog.open(DelivererDetailsDialogComponent, {
      width: '800px',
      data: deliverer
    });
  }

  openAddProductDialog(deliverer: Deliverer): void {
    if (!deliverer.active) {
      this.snackBar.open('No se pueden agregar productos a un repartidor inactivo', 'Cerrar', {
        duration: 3000,
        horizontalPosition: 'end',
        verticalPosition: 'top'
      });
      return;
    }

    const dialogRef = this.dialog.open(AddStockDialogComponent, {
      width: '600px',
      data: { deliverer }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadDeliverers();
      }
    });
  }

  getTotalDeliverers(): number {
    return this.dataSource.data.length;
  }

  getActiveDeliverers(): number {
    return this.dataSource?.data?.filter(deliverer => deliverer.active)?.length || 0;
  }


  formatDelivererDate(date?: Date | null): string {
    if (!date) return '-';
    return this.datePipe.transform(date, 'dd/MM/yyyy') || '-';
  }

  formatDelivererTime(date?: Date | null): string {
    if (!date) return '-';
    return this.datePipe.transform(date, 'HH:mm') || '-';
  }

  downloadDelivererReport(deliverer: Deliverer): void {
    const token = sessionStorage.getItem('access_token');
    
    if (!token) {
      this.snackBar.open('No hay una sesión activa. Por favor, inicie sesión nuevamente.', 'Cerrar', {
        duration: 3000,
        horizontalPosition: 'end',
        verticalPosition: 'top'
      });
      this.router.navigate(['/login']);
      return;
    }

    this.visitService.getDeliveriesToday(deliverer.email).subscribe({
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
        doc.text(`Entregas del día - ${deliverer.name}`, 14, 16);

        const columns = [
          'ID', 
          'Fecha', 
          'Estado', 
          'Dirección',
          'Teléfono'
        ];
        
        const rows = deliveries.map(delivery => [
          delivery.id || 'N/A',
          delivery.deliveryDate.split('T')[0],
          this.getStatusLabel(delivery.status),
          delivery.address || 'N/A',
          delivery.phoneNumber || 'N/A'
        ]);

        (doc as any).autoTable({
          head: [columns],
          body: rows,
          startY: 25,
          theme: 'grid',
          styles: { fontSize: 8 },
          headStyles: { fillColor: [66, 66, 66] }
        });

        const fileName = `entregas-${deliverer.name}-${new Date().toISOString().split('T')[0]}.pdf`;
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
} 