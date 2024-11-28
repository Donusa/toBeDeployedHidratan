import { Component, OnInit, ViewChild } from '@angular/core';
import { AuthenticationService } from 'src/app/services/authenticationService.service';
import { DeliveryService } from 'src/app/services/deliveryService/delivery-service';
import { Location } from '@angular/common';
import { Router } from '@angular/router';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatDialog } from '@angular/material/dialog';
import { ModalDeliveryDetailComponent } from '../modals/delivery-modal/modal-delivery-detail/modal-delivery-detail.component';
import { ModalDeliveryComponent } from '../modals/delivery-modal/modal-form-delivery/modal-delivery.component';
import { DeliveryViewResponse } from 'src/interfaces/DeliveryViewResponse.interface';
import { BehaviorSubject } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Client } from 'src/interfaces/client.interface';
import { ClientService } from 'src/app/services/clientService/client.service';
import { DatePipe } from '@angular/common';


@Component({
  selector: 'app-delivery-view',
  templateUrl: './delivery-view.component.html',
  styleUrls: ['./delivery-view.component.css'],
  providers: [DatePipe]
})
export class DeliveryViewComponent implements OnInit {
  isAdmin: boolean = false;
  userEmail: string = '';
  deliveries: DeliveryViewResponse[] = [];
  dataSource: MatTableDataSource<DeliveryViewResponse>;
  selectedStatus: string = 'all';
  displayedColumns: string[] = [
    'clientName',
    'clientAdress',
    'delivererName',
    'debt',
    'date',
    'time',
    'status'
  ];
  
  private loadingSubject = new BehaviorSubject<boolean>(true);
  isLoading$ = this.loadingSubject.asObservable();

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  clients: Client[] = [];
  isCreatingDelivery = false;
  isMobile: boolean = false;

  constructor(
    private authService: AuthenticationService,
    private deliveryService: DeliveryService,
    private clientService: ClientService,
    private location: Location,
    private router: Router,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private datePipe: DatePipe,
  ) {
    this.isAdmin = this.authService.isAdmin();
    this.userEmail = localStorage.getItem('email') || '';
    this.dataSource = new MatTableDataSource<DeliveryViewResponse>();
    this.checkScreenSize();
    
    // Add custom filter predicate
    this.dataSource.filterPredicate = (data: DeliveryViewResponse, filter: string) => {
      const searchStr = (
        data.client.name + 
        data.client.address + 
        data.delivererEmail + 
        data.status
      ).toLowerCase();
      return searchStr.indexOf(filter) !== -1;
    };
  }

  ngOnInit(): void {
    this.loadDeliveries();
    this.loadClients();
    window.addEventListener('resize', () => {
      this.checkScreenSize();
    });
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  private loadDeliveries(): void {
    this.loadingSubject.next(true);
    
    this.deliveryService.getDeliveries().subscribe({
      next: (deliveries) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (!this.isAdmin) {
          this.deliveries = deliveries.filter(delivery => {
            const [datePart] = delivery.deliveryDate.split('T');
            const [day, month, year] = datePart.split('/');
            const deliveryDate = new Date(+year, +month - 1, +day);
            deliveryDate.setHours(0, 0, 0, 0);

            return delivery.delivererEmail === this.userEmail && 
                   deliveryDate.getTime() === today.getTime();
          });

          if (this.deliveries.length === 0) {
            this.showNotification('No tienes repartos asignados para hoy');
          }
        } else {
          this.deliveries = deliveries;
        }
        
        this.dataSource.data = this.deliveries;
        this.filterDeliveries();
        this.loadingSubject.next(false);
      },
      error: (error) => {
        console.error('Error loading deliveries:', error);
        this.showNotification('Error al cargar los repartos');
        this.loadingSubject.next(false);
      }
    });
  }

  filterDeliveries() {
    let filteredData = [...this.deliveries];

    if (this.selectedStatus !== 'all') {
      filteredData = filteredData.filter(delivery => {
        const mappedStatus = this.mapDeliveryStatus(delivery.status);
        const selectedStatusLower = this.selectedStatus.toLowerCase();
        const mappedStatusLower = mappedStatus.toLowerCase();
        return mappedStatusLower === selectedStatusLower;
      });
    }

    this.dataSource.data = filteredData;

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
    
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  getTotalDeliveries(): number {
    return this.deliveries.length;
  }

  getPendingDeliveries(): number {
    return this.deliveries.filter(d => 
      this.mapDeliveryStatus(d.status) === 'Pendiente'
    ).length;
  }

  getActiveDeliveries(): number {
    return this.deliveries.filter(d => 
      this.mapDeliveryStatus(d.status) === 'En Progreso'
    ).length;
  }

  getStatusClass(status: string): string {
    switch (status?.toUpperCase()) {
      case 'COMPLETED':
        return 'status-completed';
      case 'PENDING':
        return 'status-pending';
      case 'CANCELED':
        return 'status-canceled';
      default:
        return 'status-pending';
    }
  }

  goBack(): void {
    if (window.history.length > 1) {
      this.location.back();
    } else {
      this.router.navigate(['/home']);
    }
  }

  openDeliveryDetailDialog(delivery: DeliveryViewResponse): void {
    const dialogRef = this.dialog.open(ModalDeliveryDetailComponent, {
      width: '600px',
      data: delivery
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.action === 'complete' && result.delivery) {
        const index = this.deliveries.findIndex(d => d.deliverId === result.delivery.deliverId);
        if (index !== -1) {
          this.deliveries[index] = {
            ...this.deliveries[index],
            status: 'Entregado'
          };
          this.dataSource.data = [...this.deliveries];
          this.createNextDelivery(result.delivery);
        }
      } else if (result?.action === 'edit' && result.delivery) {
        const index = this.deliveries.findIndex(d => d.deliverId === result.delivery.id);
        if (index !== -1) {
          this.deliveries[index] = result.delivery;
          this.dataSource.data = this.deliveries;
          this.showSuccess('Reparto actualizado exitosamente');

          this.selectedStatus = 'all';
          this.filterDeliveries();
        }
      }
    });
  }

  private createNextDelivery(completedDelivery: DeliveryViewResponse): void {
    if (!completedDelivery.client?.frecuency || 
        !completedDelivery.deliveryDate || 
        !completedDelivery.client?.id ||
        !completedDelivery.delivererEmail) {
      return;
    }

    this.isCreatingDelivery = true;

    const products = completedDelivery.client.clientProducts.map(cp => ({
      id: cp.product.id,
      name: cp.product.name,
      price: cp.product.price,
      stock: cp.quantity
    }));

    const nextDeliveryDate = this.calculateNextDeliveryDate(
      completedDelivery.deliveryDate,
      completedDelivery.client.frecuency
    );


    const newDelivery = {
      client: completedDelivery.client,
      assignedTo: completedDelivery.delivererEmail,
      status: 'PENDING',
      deliveryDate: nextDeliveryDate,
      products: products
    };

    this.deliveryService.createDelivery(newDelivery).subscribe({
      next: (delivery) => {
        this.isCreatingDelivery = false;
        this.loadDeliveries();
        this.showSuccess('Próximo reparto programado correctamente');
      },
      error: (error) => {
        this.isCreatingDelivery = false;
        console.error('Error creating next delivery:', error);
        this.showError('Error al programar el próximo reparto');
      }
    });
  }

  private calculateNextDeliveryDate(currentDate: string, frequency: number): string {
    const [datePart, timePart] = currentDate.split('T');
    const [day, month, year] = datePart.split('/');
    
    const date = new Date(+year, +month - 1, +day);
    date.setDate(date.getDate() + frequency);
    
    
    if (date.getDay() === 0) {
      date.setDate(date.getDate() + 1);
    }
    
    const nextDay = date.getDate().toString().padStart(2, '0');
    const nextMonth = (date.getMonth() + 1).toString().padStart(2, '0');
    const nextYear = date.getFullYear();
    
    return `${nextDay}/${nextMonth}/${nextYear}T${timePart}`;
  }

  private showSuccess(message: string): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: 3000,
      panelClass: ['success-snackbar']
    });
  }

  openNewDeliveryForm(): void {
    const dialogRef = this.dialog.open(ModalDeliveryComponent, {
      width: '800px',
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.isCreatingDelivery = true;
        this.deliveryService.createDelivery(result).subscribe({
          next: (delivery) => {
            this.loadDeliveries();
            this.showSuccess('Reparto creado exitosamente');
            this.isCreatingDelivery = false;
          },
          error: (error) => {
            console.error('Error creating delivery:', error);
            this.showError('Error al crear el reparto: ' + (error.message || 'Error desconocido'));
            this.isCreatingDelivery = false;
          },
          complete: () => {
            this.isCreatingDelivery = false;
          }
        });
      }
    });
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: 3000,
      panelClass: ['error-snackbar']
    });
  }

  private loadClients(): void {
    this.clientService.getClients().subscribe({
      next: (clients) => {
        this.clients = clients;
      },
      error: (error) => {
        console.error('Error loading clients:', error);
        this.showError('Error al cargar los clientes');
      }
    });
  }

  formatDeliveryDate(dateTimeString: string): string {
    if (!dateTimeString) return '';
    
    try {
      // Parse the date string, assuming it's in format "dd/MM/yyyy'T'HH:mm"
      const [datePart] = dateTimeString.split('T');
      const [day, month, year] = datePart.split('/');
      const date = new Date(+year, +month - 1, +day);
      
      if (isNaN(date.getTime())) {
        return '';
      }
      
      return this.datePipe.transform(date, 'dd/MM/yyyy') || '';
    } catch (error) {
      console.error('Error parsing date:', error);
      return '';
    }
  }

  formatDeliveryTime(dateTimeString: string): string {
    if (!dateTimeString) return '';
    
    try {
      const [, timePart] = dateTimeString.split('T');
      if (!timePart) return '';
      
      return timePart;
    } catch (error) {
      console.error('Error parsing time:', error);
      return '';
    }
  }

  mapDeliveryStatus(status: string): string {
    switch (status?.toUpperCase()) {
      case 'COMPLETED':
        return 'Entregado';
      case 'PENDING':
        return 'Pendiente';
      case 'CANCELED':
        return 'Cancelado';
      default:
        return status || 'Pendiente';
    }
  }

  private showNotification(message: string): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: 5000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
      panelClass: ['info-snackbar']
    });
  }

  private checkScreenSize() {
    this.isMobile = window.innerWidth <= 768;
    this.displayedColumns = this.isMobile 
      ? ['clientName', 'clientAdress', 'date']
      : ['clientName', 'clientAdress', 'delivererName', 'debt', 'date', 'time', 'status'];
  }
}
