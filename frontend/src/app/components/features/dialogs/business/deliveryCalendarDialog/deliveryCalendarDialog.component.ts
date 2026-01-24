import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { VisitService } from '../../../../../services/visitService/visit.service';
import { ClientService } from '../../../../../services/clientService/client.service';
import { Client } from '../../../../../interfaces/client.interface';
import { DeliveryViewResponse } from '../../../../../interfaces/DeliveryViewResponse.interface';
import { forkJoin } from 'rxjs';

interface ProjectedDelivery {
  clientName: string;
  address: string;
  frequency: number;
  lastVisit: Date;
  delivererName: string;
}

@Component({
  selector: 'app-delivery-calendar-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatDatepickerModule,
    MatCardModule,
    MatListModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './deliveryCalendarDialog.component.html',
  styleUrls: ['./deliveryCalendarDialog.component.css']
})
export class DeliveryCalendarDialogComponent implements OnInit {
  selectedDate: Date | null = null;
  projectedDeliveries: ProjectedDelivery[] = [];
  isLoading: boolean = true;
  
  private clients: Client[] = [];
  private visits: DeliveryViewResponse[] = [];

  constructor(
    private dialogRef: MatDialogRef<DeliveryCalendarDialogComponent>,
    private visitService: VisitService,
    private clientService: ClientService
  ) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.isLoading = true;
    forkJoin({
      clients: this.clientService.getClients(),
      visits: this.visitService.getVisits()
    }).subscribe({
      next: (data) => {
        this.clients = data.clients;
        this.visits = data.visits;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading data', err);
        this.isLoading = false;
      }
    });
  }

  onDateSelected(date: Date) {
    this.selectedDate = date;
    this.calculateDeliveriesForDate(date);
  }

  calculateDeliveriesForDate(targetDate: Date) {
    if (!targetDate) return;
    
    // Normalize target date to start of day
    const target = new Date(targetDate);
    target.setHours(0, 0, 0, 0);
    const targetTime = target.getTime();

    this.projectedDeliveries = [];

    this.clients.forEach(client => {
      // Ensure frequency is treated as a number
      const frequency = Number(client.frecuency);

      // If frequency is 0, undefined or invalid, skip
      if (!frequency || frequency <= 0 || isNaN(frequency)) return;

      // Find the latest visit for this client
      const clientVisits = this.visits.filter(v => v.client.id === client.id);
      
      let lastVisitDate: Date;
      let lastDelivererName = 'Sin asignar';

      if (clientVisits.length > 0) {
        // Sort by date descending
        clientVisits.sort((a, b) => {
          return new Date(this.parseDate(b.deliveryDate)).getTime() - new Date(this.parseDate(a.deliveryDate)).getTime();
        });
        const dateStr = clientVisits[0].deliveryDate;
        lastVisitDate = new Date(this.parseDate(dateStr));
        
        // Get last deliverer
        if (clientVisits[0].delivererName) {
            lastDelivererName = clientVisits[0].delivererName;
        }

        // Validation: if lastVisitDate is Invalid Date, log and skip
        if (isNaN(lastVisitDate.getTime())) {
          console.warn(`Invalid last visit date for client ${client.id}: ${dateStr}`);
          return;
        }
      } else {
        // If no history, we cannot project based on past visits.
        return;
      }

      lastVisitDate.setHours(0, 0, 0, 0);

      // Optimization: Calculate days difference
      const diffTime = targetTime - lastVisitDate.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

      // If target is before last visit, ignore (unless we want to show past missed deliveries? No, "proximas entregas")
      if (diffDays <= 0) return;

      // Check if target date matches frequency projection
      
      if (diffDays % frequency === 0) {
          this.projectedDeliveries.push({
            clientName: `Client #${client.id}`, 
            address: client.address,
            frequency: frequency,
            lastVisit: lastVisitDate,
            delivererName: lastDelivererName
          });
      }
    });
  }

  private parseDate(dateStr: string): Date {
    // Handle format "DD/MM/YYYYTHH:mm" which is common in some inputs
    if (dateStr.includes('T')) {
      // If it looks like ISO but has / in date part? Unlikely but possible "10/12/2025T09:07" as per log
      if (dateStr.includes('/')) {
        const [datePart, timePart] = dateStr.split('T');
        const parts = datePart.split('/');
        if (parts.length === 3) {
          return new Date(+parts[2], +parts[1] - 1, +parts[0]); // Ignore time part for day calculation
        }
      }
      return new Date(dateStr);
    }
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      return new Date(+parts[2], +parts[1] - 1, +parts[0]);
    }
    return new Date(dateStr);
  }

  onClose(): void {
    this.dialogRef.close();
  }
}
