import { Component, OnInit } from '@angular/core';
import { AuthenticationService } from 'src/app/services/authenticationService.service';
import { Location } from '@angular/common';
import { Router } from '@angular/router';
import { DeliveryPerson } from '../../interfaces/delivery-person.interface';
import {DeliveryManagementService} from 'src/app/services/delivery-managementService/delivery-management-service';
import { MatDialog } from '@angular/material/dialog';
import { ModalWorkerComponent } from '../modals/worker-modal/modal-form-worker/modal-worker.component';
import { ModalWorkerDetailComponent } from '../modals/worker-modal/modal-worker-detail/modal-worker-detail.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ModalPendingDeliveriesComponent } from '../modals/delivery-modal/modal-pending-deliveries/modal-pending-deliveries.component';
import { DeliveryService } from 'src/app/services/deliveryService/delivery-service';
import { DeliveryViewResponse } from 'src/interfaces/DeliveryViewResponse.interface';
import { ModalCompletedDeliveriesComponent } from '../modals/delivery-modal/modal-completed-deliveries/modal-completed-deliveries.component';

@Component({
  selector: 'app-delivery-management',
  templateUrl: './delivery-management.component.html',
  styleUrls: ['./delivery-management.component.css']
})
export class DeliveryManagementComponent implements OnInit {
  isAdmin: boolean = false;
  deliveryPersonnel: DeliveryPerson[] = [];
  filteredPersonnel: DeliveryPerson[] = [];
  isLoading = false;
  showOnlyActive: boolean = false;
  activeDeliveries: DeliveryViewResponse[] = [];
  deliveries: DeliveryViewResponse[] = [];

  constructor(
    private authService: AuthenticationService,
    private deliveryPersonService: DeliveryManagementService,
    private location: Location,
    private router: Router,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private deliveryService: DeliveryService
  ) {
    this.isAdmin = this.authService.isAdmin();
  }

  ngOnInit(): void {
    this.loadDeliveryPersonnel();
    this.loadDeliveries();
  }

  private loadDeliveryPersonnel(): void {
    this.isLoading = true;
    this.deliveryPersonService.getDeliveryPersons().subscribe({
      next: (personnel) => {
        this.deliveryPersonnel = personnel.map(person => ({
          name: person.name || 'Sin nombre',
          email: person.email,
          role: person.role,
          active: person.active ?? true
        }));
        this.filteredPersonnel = [...this.deliveryPersonnel];
        this.isLoading = false;
      },
      error: (error) => {
        this.showError('Error al cargar los repartidores');
        this.isLoading = false;
      }
    });
  }

  private loadDeliveries(): void {
    this.deliveryService.getDeliveries().subscribe({
      next: (deliveries) => {
        this.deliveries = deliveries;
      },
      error: (error) => {
        this.showError('Error al cargar los repartos');
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

  getTotalDeliveryPersonnel(): number {
    return this.deliveryPersonnel.filter(p => 
      (p.role === 'ROLE_DELIVERY' || p.role === 'ROLE_ADMIN') && p.active
    ).length;
  }

  getActiveDeliveries(): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return this.deliveries?.filter(delivery => {
      const [datePart] = delivery.deliveryDate.split('T');
      const [day, month, year] = datePart.split('/');
      const deliveryDate = new Date(+year, +month - 1, +day);
      deliveryDate.setHours(0, 0, 0, 0);
      
      return (delivery.status === 'PENDING' || delivery.status === 'Pendiente') && 
             deliveryDate.getTime() === today.getTime();
    }).length || 0;
  }

  getCompletedDeliveries(): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return this.deliveries?.filter(delivery => {
      const [datePart] = delivery.deliveryDate.split('T');
      const [day, month, year] = datePart.split('/');
      const deliveryDate = new Date(+year, +month - 1, +day);
      deliveryDate.setHours(0, 0, 0, 0);
      return (delivery.status === 'COMPLETED' || delivery.status === 'Entregado') && 
             deliveryDate.getTime() === today.getTime();
    }).length || 0;
  }

  getStatusIcon(active: boolean | undefined): string {
    if (active === undefined) return 'info';
    return active ? 'check_circle' : 'cancel';
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value.toLowerCase();
    let filtered = this.deliveryPersonnel.filter(person => 
      person.name.toLowerCase().includes(filterValue) || 
      person.email.toLowerCase().includes(filterValue)
    );
    
    if (this.showOnlyActive) {
      filtered = filtered.filter(person => person.active);
    }
    
    this.filteredPersonnel = filtered;
  }

  editPerson(person: DeliveryPerson, originalEmail: string): void {
    const updateData = {
      email: person.email,
      name: person.name,
      role: person.role || 'ROLE_DELIVERY',
      active: person.active
    };

    this.deliveryPersonService.updateDeliveryPerson(updateData, originalEmail)
      .subscribe({
        next: (response) => {
          const index = this.deliveryPersonnel.findIndex(p => p.email === originalEmail);
          if (index !== -1) {
            this.deliveryPersonnel[index] = {
              ...this.deliveryPersonnel[index],
              ...response
            };
            this.filteredPersonnel = [...this.deliveryPersonnel];
            this.showSuccess(person.active ? 
              'Usuario activado correctamente' : 
              'Repartidor actualizado correctamente'
            );
          }
        },
        error: (error) => {
          this.showError('Error al actualizar el repartidor');
        }
      });
  }

  goBack(): void {
    if (window.history.length > 1) {
      this.location.back();
    } else {
      this.router.navigate(['/home']);
    }
  }

  openPersonnelDetails(person: DeliveryPerson): void {
    const dialogRef = this.dialog.open(ModalWorkerDetailComponent, {
      width: '600px',
      data: {...person},
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        if (result.action === 'edit') {
          this.editPerson(result.person, result.originalEmail);
        } else if (result.action === 'toggleStatus') {
          this.updatePersonStatus(result.person);
        }
      }
    });
  }

  private updatePersonStatus(updatedPerson: DeliveryPerson): void {
    const currenUserEmail = localStorage.getItem('email');

    if(updatedPerson.email === currenUserEmail) {
      this.showError('No puedes dar de baja tu propio usuario');
      return;
    }


    if (!updatedPerson.active) {
      this.showError('El usuario ya está dado de baja');
      return;
    }

    this.deliveryPersonService.disableDeliveryPerson(updatedPerson.email).subscribe({
      next: (response) => {
        const index = this.deliveryPersonnel.findIndex(p => p.email === updatedPerson.email);
        if (index !== -1) {
          this.deliveryPersonnel[index] = {
            ...this.deliveryPersonnel[index],
            active: false
          };
          this.filteredPersonnel = [...this.deliveryPersonnel];
          this.showSuccess('Usuario dado de baja correctamente');
        }
      },
      error: (error) => {
        this.showError('Error al dar de baja al usuario');
      }
    });
  }

  openNewPersonnelDialog(): void {
    const dialogRef = this.dialog.open(ModalWorkerComponent, {
      width: '600px',
      data: {
        id: this.deliveryPersonnel.length + 1,
        name: '',
        email: '',
        active: true
      },
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.action === 'edit') {
        this.deliveryPersonnel.push(result.person);
        this.filteredPersonnel = [...this.deliveryPersonnel];
      }
    });
  }

  toggleActiveFilter(): void {
    this.showOnlyActive = !this.showOnlyActive;
    this.filteredPersonnel = this.showOnlyActive 
      ? this.deliveryPersonnel.filter(person => person.active)
      : [...this.deliveryPersonnel];
  }

  showActiveDeliveries(): void {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const activeDeliveries = this.deliveries?.filter(delivery => {
      const [datePart] = delivery.deliveryDate.split('T');
      const [day, month, year] = datePart.split('/');
      const deliveryDate = new Date(+year, +month - 1, +day);
      deliveryDate.setHours(0, 0, 0, 0);
      
      return (delivery.status === 'PENDING' || delivery.status === 'Pendiente') && 
             deliveryDate.getTime() === today.getTime();
    }) || [];

    this.dialog.open(ModalPendingDeliveriesComponent, {
      width: '600px',
      data: { deliveries: activeDeliveries }
    });
  }

  showCompletedDeliveries(): void {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    
    const completedDeliveries = this.deliveries.filter(delivery => {
      // Separar fecha y hora por la T
      const [datePart] = delivery.deliveryDate.split('T');
      const [day, month, year] = datePart.split('/');
      const deliveryDate = new Date(+year, +month - 1, +day);
      deliveryDate.setHours(0, 0, 0, 0);
      
      const isToday = deliveryDate.getTime() === today.getTime();
      const isCompleted = delivery.status === 'COMPLETED' || delivery.status === 'Entregado';
      
      return isCompleted && isToday;
    });
    
    
    this.dialog.open(ModalCompletedDeliveriesComponent, {
      width: '600px',
      data: { deliveries: completedDeliveries }
    });
  }

  private mapDeliveryStatus(status: string): string {
    switch (status?.toLowerCase()) {
      case 'pending':
        return 'Pendiente';
      case 'completed':
        return 'Entregado';
      case 'cancelled':
        return 'Cancelado';
      default:
        return 'Pendiente';
    }
  }
}
