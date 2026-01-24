import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatSidenavModule, MatDrawer } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { RouterModule } from '@angular/router';
import { Router } from '@angular/router';
import { AuthenticationService } from '../../../../services/authentication.service';
import { RoleDirective } from '../../../../directives/role.directive';
import { VisitService } from '../../../../services/visitService/visit.service';
import { DeliveryViewResponse } from '../../../../interfaces/DeliveryViewResponse.interface';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError, map, of } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';
import { NotificationBellComponent } from '../../notifications/notification-bell/notification-bell.component';


interface MenuItem {
  path: string;
  icon: string;
  label: string;
  roles?: string[];
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    MatSidenavModule,
    MatListModule,
    MatIconModule,
    MatToolbarModule,
    MatButtonModule,
    MatMenuModule,
    MatCardModule,
    MatDividerModule,
    RouterModule,
    RoleDirective,
    NotificationBellComponent
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit, AfterViewInit {
  @ViewChild('sidenav') sidenav!: MatDrawer;
  @ViewChild('cardsContainer') cardsContainer!: ElementRef;
  
  username: string = '';
  userEmail: string = '';
  userRole: string = '';
  isAdmin: boolean = false;
  isWorker: boolean = false;
  private isDragging = false;
  private startX: number = 0;
  private scrollLeft: number = 0;
  private deliveries: DeliveryViewResponse[] = [];


  constructor(
    private router: Router,
    private authenticationService: AuthenticationService,
    private visitService: VisitService,
    private snackBar: MatSnackBar,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isAdmin = this.authenticationService.isAdmin();
    this.isWorker = this.authenticationService.isWorker();
    this.username = this.isAdmin ? 'Administrador' : 'Repartidor';
    this.userRole = this.authenticationService.getCurrentRole();
    this.userEmail = this.authenticationService.getCurrentEmail();
  }

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.loadVisits();
    }
  }

  ngAfterViewInit() {
    if (!isPlatformBrowser(this.platformId)) return;

    const container = this.cardsContainer?.nativeElement;
    if (!container) return;
    
    const onMouseDown = (e: MouseEvent) => {
      this.isDragging = true;
      container.classList.add('active');
      this.startX = e.pageX - container.offsetLeft;
      this.scrollLeft = container.scrollLeft;

      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!this.isDragging) return;
      e.preventDefault();
      const x = e.pageX - container.offsetLeft;
      const walk = (x - this.startX) * 1.5; // Adjusted speed
      container.scrollLeft = this.scrollLeft - walk;
    };

    const onMouseUp = () => {
      this.isDragging = false;
      container.classList.remove('active');
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    container.addEventListener('mousedown', onMouseDown);
  }

  getTodayDeliveries(): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return this.deliveries.filter(delivery => {
      if (!delivery.deliveryDate) return false;
      
      try {
        const [datePart] = delivery.deliveryDate.split('T');
        const [day, month, year] = datePart.split('/');
        const deliveryDate = new Date(+year, +month - 1, +day);
        deliveryDate.setHours(0, 0, 0, 0);
        
        return deliveryDate.getTime() === today.getTime();
      } catch (error) {
        return false;
      }
    }).length;
  }

  getPendingVisits(): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return this.deliveries.filter(delivery => {
      if (!delivery.deliveryDate) return false;
      
      try {
        const [datePart] = delivery.deliveryDate.split('T');
        const [day, month, year] = datePart.split('/');
        const deliveryDate = new Date(+year, +month - 1, +day);
        deliveryDate.setHours(0, 0, 0, 0);
        
        const isToday = deliveryDate.getTime() === today.getTime();
        const isPending = delivery.status === 'PENDING' || 
                         delivery.status === 'Pendiente';
        return isToday && isPending;
      } catch (error) {
        return false;
      }
    }).length;
  }

  getCompletionRate(): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayDeliveries = this.deliveries.filter(delivery => {
      if (!delivery.deliveryDate) return false;
      
      try {
        const [datePart] = delivery.deliveryDate.split('T');
        const [day, month, year] = datePart.split('/');
        const deliveryDate = new Date(+year, +month - 1, +day);
        deliveryDate.setHours(0, 0, 0, 0);
        
        return deliveryDate.getTime() === today.getTime();
      } catch (error) {
        return false;
      }
    });
    
    if (todayDeliveries.length === 0) return 0;
    
    const completed = todayDeliveries.filter(delivery => 
      delivery.status === 'COMPLETED' || 
      delivery.status === 'Entregado'
    ).length;
    
    return Math.round((completed / todayDeliveries.length) * 100);
  }

  private loadVisits(): void {
    this.visitService.getVisits().pipe(
      map((visits: any[]) => {
        if (!this.isAdmin) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          return visits.filter(visit => {
            const isDelivererVisit = visit.delivererEmail === this.userEmail;
            
            if (!visit.deliveryDate) return false;
            try {
              const [datePart] = visit.deliveryDate.split('T');
              const [day, month, year] = datePart.split('/');
              const visitDate = new Date(+year, +month - 1, +day);
              visitDate.setHours(0, 0, 0, 0);
              
              return isDelivererVisit && visitDate.getTime() === today.getTime();
            } catch (error) {
              return false;
            }
          });
        }
        return visits;
      }),
      catchError((error) => {
        this.snackBar.open('Error al cargar las entregas', 'Cerrar', {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
          panelClass: ['error-snackbar']
        });
        console.error('Error loading deliveries:', error);
        return of([] as DeliveryViewResponse[]);
      })
    ).subscribe({
      next: (filteredDeliveries) => {
        this.deliveries = filteredDeliveries;
      }
    });
  }

  logout() {
    this.authenticationService.logout();
    this.router.navigate(['/login']);
  }

  closeSidenav() {
    if (this.sidenav && this.sidenav.mode === 'over') {
      this.sidenav.close();
    }
  }

  canShowMenuItem(item: MenuItem): boolean {
    if (!item.roles) return true;
    if (this.isAdmin) return item.roles.includes('ADMIN');
    if (this.isWorker) return item.roles.includes('REPARTIDOR');
    return false;
  }
} 