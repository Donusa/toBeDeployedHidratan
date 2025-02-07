import { Component, OnInit, AfterViewInit, ViewChild, PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Location } from '@angular/common';
import { DatePipe } from '@angular/common';
import { AuthenticationService } from '../../../../services/authentication.service';
import { VisitService } from '../../../../services/visitService/visit.service';
import { NewVisitDialogComponent } from '../../dialogs/visits/newVisitDialog/newVisitDialog.component';
import { DeliveryViewResponse } from '../../../../interfaces/DeliveryViewResponse.interface';
import { VisitDetailsDialogComponent } from '../../dialogs/visits/visitDetailsDialog/visitDetailsDialog.component';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-visit',
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
  templateUrl: './visit.component.html',
  styleUrl: './visit.component.css',
  providers: [DatePipe]
})
export class VisitComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = ['client', 'deliverer', 'date', 'time', 'status'];
  dataSource: MatTableDataSource<DeliveryViewResponse>;
  isLoading = true;
  isAdmin = false;
  visits: DeliveryViewResponse[] = [];
  isMobile = window.innerWidth <= 576;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private location: Location,
    private authService: AuthenticationService,
    private visitService: VisitService,
    private snackBar: MatSnackBar,
    private datePipe: DatePipe,
    private dialog: MatDialog,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.dataSource = new MatTableDataSource<DeliveryViewResponse>([]);
    this.isAdmin = this.authService.isAdmin();
  }

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.checkScreenSize();
      window.addEventListener('resize', () => this.checkScreenSize());
    }
    this.loadVisits();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  loadVisits() {
    this.isLoading = true;
    this.visitService.getVisits().subscribe({
      next: (visits) => {
        this.visits = visits;
        if (!this.isAdmin) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          this.visits = visits.filter(visit => {
            const visitDate = this.parseDeliveryDate(visit.deliveryDate);
            visitDate.setHours(0, 0, 0, 0);
            return visitDate.getTime() === today.getTime();
          });
        }

        
        this.visits.sort((a, b) => {
        
          if (a.status === 'PENDING' && b.status !== 'PENDING') return -1;
          if (a.status !== 'PENDING' && b.status === 'PENDING') return 1;

          const dateA = this.parseDeliveryDate(a.deliveryDate);
          const dateB = this.parseDeliveryDate(b.deliveryDate);
          return dateB.getTime() - dateA.getTime();
        });

        this.dataSource.data = this.visits;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading visits:', error);
        this.snackBar.open('Error al cargar las visitas', 'Cerrar', {
          duration: 3000
        });
        this.isLoading = false;
      }
    });
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  goBack() {
    this.location.back();
  }

  getTodayVisits(): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return this.visits.filter(visit => {
      const visitDate = this.parseDeliveryDate(visit.deliveryDate);
      visitDate.setHours(0, 0, 0, 0);
      return visitDate.getTime() === today.getTime();
    }).length;
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

  getPendingVisits(): number {
    return this.visits.filter(visit => 
      visit.status === 'PENDING' || 
      visit.status === 'Pendiente'
    ).length;
  }

  getCompletionRate(): number {
    if (this.visits.length === 0) return 0;
    
    const completed = this.visits.filter(visit => 
      visit.status === 'COMPLETED' || 
      visit.status === 'Completado'
    ).length;
    
    return Math.round((completed / this.visits.length) * 100);
  }

  formatVisitDate(dateString: string): string {
    if (!dateString) return 'N/A';
    
    try {
      const [datePart] = dateString.split('T');
      const [day, month, year] = datePart.split('/');
      return `${day}/${month}/${year}`;
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'N/A';
    }
  }

  formatVisitTime(dateString: string): string {
    if (!dateString) return 'N/A';
    
    try {
      const [, timePart] = dateString.split('T');
      if (!timePart) return 'N/A';
      return timePart;
    } catch (error) {
      console.error('Error formatting time:', error);
      return 'N/A';
    }
  }

  getStatusLabel(status: string): string {
    const statusMap: { [key: string]: string } = {
      'PENDING': 'Pendiente',
      'IN_PROGRESS': 'En Progreso',
      'COMPLETED': 'Completado',
      'CANCELLED': 'Cancelado'
    };
    return statusMap[status] || status;
  }

  openNewVisitDialog() {
    const dialogRef = this.dialog.open(NewVisitDialogComponent, {
      width: '500px'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadVisits();
        this.snackBar.open('Visita creada exitosamente', 'Cerrar', {
          duration: 3000
        });
      }
    });
  }

  openVisitDetails(visit: DeliveryViewResponse) {
    const dialogRef = this.dialog.open(VisitDetailsDialogComponent, {
      width: '600px',
      data: visit
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadVisits();
      }
    });
  }

  private checkScreenSize() {
    if (isPlatformBrowser(this.platformId)) {
      this.isMobile = window.innerWidth <= 576;
      this.displayedColumns = this.isMobile 
        ? ['client', 'deliverer', 'date']
        : ['client', 'deliverer', 'date', 'time', 'status'];
    } else {

      this.isMobile = false;
      this.displayedColumns = ['client', 'deliverer', 'date', 'time', 'status'];
    }
  }
} 