import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule, Location, DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort, Sort } from '@angular/material/sort';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { AuthenticationService } from '../../../../services/authentication.service';
import { ClientService } from '../../../../services/clientService/client.service';
import { Client } from '../../../../interfaces/client.interface';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NewClientDialogComponent } from '../../dialogs/clients/newClientDialog/newClientDialog.component';
import { ClientDetailsDialogComponent } from '../../dialogs/clients/clientDetailsDialog/clientDetailsDialog.component';
import { EditClientDialogComponent } from '../../dialogs/clients/editClientDialog/editClientDialog.component';


@Component({
  selector: 'app-client',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatInputModule,
    MatFormFieldModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    MatProgressSpinnerModule,
    MatDialogModule,
  ],
  templateUrl: './client.component.html',
  styleUrl: './client.component.css',
  providers: [DatePipe]
})
export class ClientComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = ['address', 'debt', 'phoneNumber', 'nextVisit', 'frecuency'];
  dataSource: MatTableDataSource<Client>;
  isLoading = true;
  isMobile = window.innerWidth <= 576;
  isAdmin = false;
  clients: Client[] = [];

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private router: Router,
    private location: Location,
    private authService: AuthenticationService,
    private clientService: ClientService,
    private snackBar: MatSnackBar,
    private datePipe: DatePipe,
    private dialog: MatDialog
  ) {
    this.dataSource = new MatTableDataSource<Client>([]);
    this.isAdmin = this.authService.isAdmin();
  }

  ngOnInit() {
    this.checkScreenSize();
    window.addEventListener('resize', () => this.checkScreenSize());
    if (this.authService.currentUserValue) {
      this.loadClients();
    }
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  loadClients() {
    this.isLoading = true;
    this.clientService.getClients().subscribe({
      next: (clients) => {
        this.clients = clients;
        this.dataSource.data = this.clients;
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
      ? ['address', 'debt', 'phoneNumber']
      : ['address', 'debt', 'phoneNumber', 'nextVisit', 'frecuency'];
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  openClientDialog() {
    const dialogRef = this.dialog.open(NewClientDialogComponent, {
        width: '500px'
    });

    dialogRef.afterClosed().subscribe(result => {
        if (result) {
            this.clientService.createClient(result).subscribe({
                next: (newClient) => {
                    this.loadClients();
                    this.snackBar.open('Cliente creado exitosamente', 'Cerrar', {
                        duration: 3000
                    });
                },
                error: (error) => {
                    this.showError('Error al crear el cliente');
                }
            });
        }
    });
  }

  openClientDetails(client: Client) {
    const dialogRef = this.dialog.open(ClientDetailsDialogComponent, {
      width: '600px',
      data: client
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const index = this.clients.findIndex(c => c.id === result.id);
        if (index !== -1) {
          this.clients[index] = result;
          this.dataSource.data = [...this.clients];
        }
      }
    });
  }

  goBack() {
    this.location.back();
  }

  getTotalClients(): number {
    return this.dataSource.data.length;
  }

  getTotalDebt(): number {
    return this.dataSource.data.reduce((acc, client) => acc + (client.debt || 0), 0);
  }

  formatClientDate(date?: Date | null): string {
    if (!date) return '-';
    return this.datePipe.transform(date, 'dd/MM/yyyy') || '-';
  }

  formatClientTime(date?: Date | null): string {
    if (!date) return '-';
    return this.datePipe.transform(date, 'HH:mm') || '-';
  }
}
