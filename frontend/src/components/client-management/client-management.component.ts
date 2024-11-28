import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Location } from '@angular/common';
import { Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { Client } from 'src/interfaces/client.interface';
import { ClientService } from 'src/app/services/clientService/client.service';
import { ModalClientManagementComponent } from '../modals/client-modal/modal-form-client/modal-client-management.component';
import { ModalClientDetailComponent } from '../modals/client-modal/modal-client-details/modal-client-detail.component';
import { AuthenticationService } from '../../app/services/authenticationService.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Sort } from '@angular/material/sort';
import { DeliveryService } from '../../app/services/deliveryService/delivery-service';
import { forkJoin } from 'rxjs';
import { DeliveryViewResponse } from 'src/interfaces/DeliveryViewResponse.interface';

interface LoadDataResponse {
  clients: Client[];
  deliveries: DeliveryViewResponse[];
}

@Component({
  selector: 'app-client-management',
  templateUrl: './client-management.component.html',
  styleUrls: ['./client-management.component.css'],
  providers: [DatePipe]
})
export class ClientManagementComponent implements OnInit, AfterViewInit {
  isAdmin: boolean = false;
  isMobile: boolean = false;
  displayedColumns: string[] = [];
  dataSource = new MatTableDataSource<Client>([]);
  isLoading = true;
  clients: Client[] = [];
  sortedData: Client[] = [];

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private clientService: ClientService,
    private deliveryService: DeliveryService,
    private authService: AuthenticationService,
    private router: Router,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private location: Location,
    private datePipe: DatePipe
  ) {
    this.isAdmin = true;
  }

  ngOnInit(): void {
    this.checkScreenSize();
    window.addEventListener('resize', () => this.checkScreenSize());
    if (this.authService.currentUserValue) {
      this.loadClients();
    }
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    
    this.dataSource.sortingDataAccessor = (item: Client, property: string) => {
      switch (property) {
        case 'nextVisit':
          return item.nextVisit || '';
        default:
          return (item as any)[property];
      }
    };
  }

  loadClients() {
    this.isLoading = true;
    forkJoin({
      clients: this.clientService.getClients(),
      deliveries: this.deliveryService.getDeliveries()
    }).subscribe({
      next: ({ clients, deliveries }) => {
        this.clients = clients.map(client => {
          const clientDeliveries = deliveries.filter(d => 
            d.client.name === client.name && 
            d.client.address === client.address &&
            d.status === 'PENDING'
          );

          const sortedDeliveries = clientDeliveries.sort((a, b) => {
            const dateA = this.parseDeliveryDate(a.deliveryDate);
            const dateB = this.parseDeliveryDate(b.deliveryDate);
            return dateA.getTime() - dateB.getTime();
          });

          const nearestDelivery = sortedDeliveries[0];

          return {
            ...client,
            nextVisit: nearestDelivery?.deliveryDate || null
          };
        });
        this.dataSource.data = this.clients;
        this.sortedData = this.clients.slice();
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error loading data:', error);
        this.isLoading = false;
        this.showError('Error al cargar los datos');
      }
    });
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: 3000,
      panelClass: ['error-snackbar']
    });
  }

  private showSuccess(message: string): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: 3000,
      panelClass: ['success-snackbar']
    });
  }

  openClientDialog(client?: Client): void {
    const dialogRef = this.dialog.open(ModalClientManagementComponent, {
      width: '800px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      data: client || {
        name: '',
        address: '',
        debt: 0,
        frecuency: 7
      },
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        if (result.id) {
          this.clientService.updateClient(result).subscribe({
            next: () => {
              this.loadClients();
              this.showSuccess('Cliente actualizado correctamente');
            },
            error: (error) => {
              console.error('Error updating client:', error);
              this.showError('Error al actualizar el cliente');
            }
          });
        } else {
          this.clientService.createClient(result).subscribe({
            next: () => {
              this.loadClients();
              this.showSuccess('Cliente creado correctamente');
            },
            error: (error) => {
              console.error('Error creating client:', error);
              this.showError('Error al crear el cliente');
            }
          });
        }
      }
    });
  }

  formatDate(date: string | Date): string {
    if (typeof date === 'string') {
      return this.datePipe.transform(new Date(date), 'dd/MM/yyyy') || '';
    }
    return this.datePipe.transform(date, 'dd/MM/yyyy') || '';
  }

  getTotalClients(): number {
    return this.dataSource.data.length;
  }

  getTotalDebt(): number {
    return this.dataSource.data.reduce((total, client) => total + client.debt, 0);
  }

  editClient(client: Client): void {
    this.openClientDialog(client);
  }

  goBack(): void {
    if (window.history.length > 1) {
      this.location.back();
    } else {
      this.router.navigate(['/home']);
    }
  }

  openClientDetails(client: any) {
    
    this.deliveryService.getDeliveries().subscribe({
      next: (deliveries) => {
        const lastDelivery = deliveries.find(d => 
          d.client.name === client.name && 
          d.client.address === client.address &&
          d.status === 'Pendiente'
        );

        const dialogRef = this.dialog.open(ModalClientDetailComponent, {
          width: '600px',
          data: {
            ...client,
            clientProducts: lastDelivery?.client.clientProducts || []
          }
        });

        dialogRef.afterClosed().subscribe(result => {
  
          if (result?.action === 'edit') {
            this.editClient(result.client);
          }
        });
      },
      error: (error) => {
        console.error('Error al cargar los productos del cliente:', error);
        this.showError('Error al cargar los productos del cliente');
      }
    });
  }

  get hasData(): boolean {
    return this.dataSource && this.dataSource.data && this.dataSource.data.length > 0;
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  private compare(a: any, b: any, isAsc: boolean) {
    return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
  }

  sortData(sort: Sort) {
    const data = this.clients.slice();
    if (!sort.active || sort.direction === '') {
      this.sortedData = data;
      return;
    }

    this.sortedData = data.sort((a: Client, b: Client) => {
      const isAsc = sort.direction === 'asc';
      switch (sort.active) {
        case 'name':
          return this.compare(a.name, b.name, isAsc);
        case 'debt':
          return this.compare(a.debt, b.debt, isAsc);
        case 'nextVisit':
          return this.compare(
            new Date(a.nextVisit || '').getTime(),
            new Date(b.nextVisit || '').getTime(),
            isAsc
          );
        default:
          return 0;
      }
    });
  }

  formatClientDate(dateTimeString: string | null | undefined): string {
    if (!dateTimeString) return '-';
    
    try {
      const [datePart] = dateTimeString.split('T');
      const [day, month, year] = datePart.split('/');
      const date = new Date(+year, +month - 1, +day);
      
      if (isNaN(date.getTime())) {
        return '-';
      }
      
      return this.datePipe.transform(date, 'dd/MM/yyyy') || '-';
    } catch (error) {
      console.error('Error parsing date:', error);
      return '-';
    }
  }

  formatClientTime(dateTimeString: string | null | undefined): string {
    if (!dateTimeString) return '-';
    
    try {
      const [, timePart] = dateTimeString.split('T');
      if (!timePart) return '-';
      
      return timePart;
    } catch (error) {
      console.error('Error parsing time:', error);
      return '-';
    }
  }

  private parseDeliveryDate(dateString: string): Date {
    if (!dateString) return new Date(0);
    
    try {
      const [datePart] = dateString.split('T');
      const [day, month, year] = datePart.split('/');
      return new Date(+year, +month - 1, +day);
    } catch (error) {
      console.error('Error parsing date:', error);
      return new Date(0);
    }
  }

  private checkScreenSize() {
    this.isMobile = window.innerWidth <= 576;
    this.displayedColumns = this.isMobile 
      ? ['name', 'address', 'debt']
      : ['name', 'address', 'debt', 'nextVisit', 'nextVisitTime', 'frecuency'];
  }
} 