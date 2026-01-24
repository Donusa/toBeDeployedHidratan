import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Location } from '@angular/common';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { HealthDataDialogComponent } from '../../dialogs/business/healthDataDialog/healthDataDialog.component';
import { DeliveryCalendarDialogComponent } from '../../dialogs/business/deliveryCalendarDialog/deliveryCalendarDialog.component';
import { HealthDataService } from '../../../../services/healthDataService/health-data.service';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-business-management',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatSnackBarModule
  ],
  templateUrl: './business-management.component.html',
  styleUrls: ['./business-management.component.css']
})
export class BusinessManagementComponent {
  
  constructor(
    private location: Location,
    private dialog: MatDialog,
    private healthDataService: HealthDataService,
    private snackBar: MatSnackBar
  ) {}

  goBack(): void {
    this.location.back();
  }

  openHealthDataDialog(): void {
    // Force cache refresh by using a new service instance logic or simply trusting the service
    this.healthDataService.getHealthData().subscribe({
      next: (response: any) => {
        const savedData = response?.data || '';
        this.showDialog(savedData);
      },
      error: (error: any) => {
        console.error('Error fetching health data:', error);
        this.showDialog('');
      }
    });
  }

  private showDialog(savedData: string): void {
    const dialogRef = this.dialog.open(HealthDataDialogComponent, {
      width: '95%',
      maxWidth: '500px',
      disableClose: true,
      data: { healthData: savedData },
      panelClass: 'responsive-dialog'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result !== undefined) {
        this.healthDataService.saveHealthData(result).subscribe({
          next: () => {
            this.snackBar.open('Datos de sanidad guardados exitosamente', 'Cerrar', {
              duration: 3000
            });
          },
          error: (error: any) => {
            console.error('Error saving health data:', error);
            this.snackBar.open('Error al guardar los datos de sanidad', 'Cerrar', {
              duration: 3000
            });
          }
        });
      }
    });
  }

  openDeliveryCalendarDialog(): void {
    this.dialog.open(DeliveryCalendarDialogComponent, {
      width: '95%',
      maxWidth: '600px',
      height: 'auto',
      maxHeight: '90vh',
      disableClose: false,
      panelClass: 'responsive-dialog'
    });
  }
}
