import { Component, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import { AuthenticationService } from 'src/app/services/authenticationService.service';
import { DatePipe } from '@angular/common';
import { Product } from 'src/interfaces/product.interface';
import { MatDialog } from '@angular/material/dialog';
import { Client } from 'src/interfaces/client.interface';
import { DeliveryService } from 'src/app/services/deliveryService/delivery-service';
import { DeliveryViewResponse } from 'src/interfaces/DeliveryViewResponse.interface';


@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  providers: [DatePipe]
})
export class HomeComponent implements OnInit, AfterViewInit {
  userRoles: string[] = [];
  currentTheme = 'light';
  private clients: Client[] = [];
  private deliveries: DeliveryViewResponse[] = [];
  private products: Product[] = [];
  username: string = '';
  userRole: string = '';
  isDarkMode = false;
  userEmail: string = '';
  isAdmin: boolean = false;
  private isDragging = false;
  private startX: number = 0;
  private scrollLeft: number = 0;
  
  @ViewChild('cardsContainer') cardsContainer!: ElementRef;

  constructor(
    private authenticationService: AuthenticationService,
    private router: Router,
    private datePipe: DatePipe,
    private dialog: MatDialog,
    private deliveryService: DeliveryService
  ) {
    const currentUser = this.authenticationService.currentUserValue;
    this.username = currentUser?.role === 'ROLE_ADMIN' ? 'Administrador' : 'Repartidor';
    this.userRole = currentUser?.role === 'ROLE_ADMIN' ? 'ADMIN' : 'REPARTIDOR';
    this.userEmail = localStorage.getItem('email') || '';
    this.isAdmin = this.authenticationService.isAdmin();
  }

  ngOnInit(): void {
    this.loadDeliveries();
    this.loadTheme();
  }

  ngAfterViewInit() {
    if (window.innerWidth >= 577) {
      const slider = document.querySelector('.dashboard-cards-scroll');
      if (slider) {
        this.initDragScroll(slider as HTMLElement);
      }
    }

    const container = this.cardsContainer?.nativeElement;
    if (!container) return;
    
    container.addEventListener('mousedown', (e: MouseEvent) => {
      this.isDragging = true;
      container.classList.add('active');
      this.startX = e.pageX - container.offsetLeft;
      this.scrollLeft = container.scrollLeft;
    });

    container.addEventListener('mouseleave', () => {
      this.isDragging = false;
      container.classList.remove('active');
    });

    container.addEventListener('mouseup', () => {
      this.isDragging = false;
      container.classList.remove('active');
    });

    container.addEventListener('mousemove', (e: MouseEvent) => {
      if (!this.isDragging) return;
      e.preventDefault();
      const x = e.pageX - container.offsetLeft;
      const walk = (x - this.startX) * 2;
      container.scrollLeft = this.scrollLeft - walk;
    });
  }

  logout(): void {
    this.authenticationService.logout();
    this.router.navigate(['/login']);
  }

  getLastThreeClients(): Client[] {
    return this.clients.slice(-3);
  }

  getLastThreePersonnel(): any[] {
    return []; // Implementar con datos reales
  }

  getClientStatusClass(client: Client): string {
    return 'status-ok';
  }

  getClientStatusIcon(client: Client): string {
    return 'check_circle';
  }

  formatDate(date: Date): string {
    return this.datePipe.transform(date, 'dd/MM/yyyy') || '';
  }

  getRecentDeliveries(): DeliveryViewResponse[] {
    return this.deliveries.slice(-3);
  }

  getLastThreeProducts(): Product[] {
    return this.products.slice(-3);
  }

  private loadTheme(): void {
    // Implementar lógica del tema
  }

  private initDragScroll(slider: HTMLElement) {
    let isDown = false;
    let startX: number;
    let scrollLeft: number;

    const start = (e: MouseEvent) => {
      isDown = true;
      slider.classList.add('active');
      startX = e.pageX - slider.offsetLeft;
      scrollLeft = slider.scrollLeft;
    };

    const end = () => {
      isDown = false;
      slider.classList.remove('active');
    };

    const move = (e: MouseEvent) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - slider.offsetLeft;
      const walk = (x - startX);
      slider.scrollLeft = scrollLeft - walk;
    };

    slider.addEventListener('mousedown', start);
    slider.addEventListener('mouseleave', end);
    slider.addEventListener('mouseup', end);
    slider.addEventListener('mousemove', move);
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

  getPendingDeliveries(): number {
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

  private loadDeliveries(): void {
    this.deliveryService.getDeliveries().subscribe({
      next: (deliveries) => {
        if (!this.isAdmin) {
          const currentUserEmail = this.authenticationService.currentUserValue?.email;
          this.deliveries = deliveries.filter(delivery => 
            delivery.delivererEmail === currentUserEmail
          );
        } else {
          this.deliveries = deliveries;
        }
      },
      error: (error) => {
        console.error('Error loading deliveries:', error);
      }
    });
  }

} 

