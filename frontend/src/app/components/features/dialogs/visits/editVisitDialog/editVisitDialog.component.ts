import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { FormBuilder, FormGroup, FormControl, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { ClientService } from '../../../../../services/clientService/client.service';
import { DelivererService } from '../../../../../services/delivererService/deliverer.service';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { Client } from '../../../../../interfaces/client.interface';
import { DeliveryViewResponse } from '../../../../../interfaces/DeliveryViewResponse.interface';
import { VisitService } from '../../../../../services/visitService/visit.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DateAdapter, NativeDateAdapter, MAT_DATE_LOCALE, MAT_DATE_FORMATS } from '@angular/material/core';

@Component({
  selector: 'app-edit-visit-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatAutocompleteModule
  ],
  providers: [
    {
      provide: DateAdapter,
      useClass: NativeDateAdapter
    },
    {
      provide: MAT_DATE_LOCALE,
      useValue: 'es-ES'
    },
    {
      provide: MAT_DATE_FORMATS,
      useValue: {
        parse: {
          dateInput: 'DD/MM/YYYY',
        },
        display: {
          dateInput: 'DD/MM/YYYY',
          monthYearLabel: 'MMM YYYY',
          dateA11yLabel: 'DD/MM/YYYY',
          monthYearA11yLabel: 'MMMM YYYY',
        },
      },
    }
  ],
  templateUrl: './editVisitDialog.component.html',
  styleUrls: ['./editVisitDialog.component.css']
})
export class EditVisitDialogComponent implements OnInit {
  visitForm: FormGroup;
  clientSearchControl = new FormControl();
  delivererSearchControl = new FormControl();
  filteredClients: Observable<Client[]>;
  filteredDeliverers: Observable<any[]>;
  clients: Client[] = [];
  deliverers: any[] = [];

  constructor(
    private dialogRef: MatDialogRef<EditVisitDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DeliveryViewResponse,
    private formBuilder: FormBuilder,
    private clientService: ClientService,
    private delivererService: DelivererService,
    private visitService: VisitService,
    private snackBar: MatSnackBar
  ) {
    this.visitForm = this.formBuilder.group({
      clientId: [data.client.id, Validators.required],
      delivererId: [data.delivererEmail, Validators.required],
      date: [this.parseDate(data.deliveryDate), Validators.required],
      time: [this.parseTime(data.deliveryDate), [Validators.required, this.validateTime.bind(this)]]
    });

    this.clientSearchControl = new FormControl(data.client);
    this.delivererSearchControl = new FormControl({
      name: data.delivererName,
      email: data.delivererEmail
    });

    this.filteredClients = this.clientSearchControl.valueChanges.pipe(
      startWith(''),
      map(value => this._filterClients(value))
    );

    this.filteredDeliverers = this.delivererSearchControl.valueChanges.pipe(
      startWith(''),
      map(value => this._filterDeliverers(value))
    );

    this.clientSearchControl.valueChanges.subscribe(value => {
      if (typeof value === 'string') {
        this.clientSearchControl.setValidators([this.validateClientSelection.bind(this)]);
      } else {
        this.clientSearchControl.setValidators(null);
      }
      this.clientSearchControl.updateValueAndValidity({ emitEvent: false });
    });

    this.delivererSearchControl.valueChanges.subscribe(value => {
      if (typeof value === 'string') {
        this.delivererSearchControl.setValidators([this.validateDelivererSelection.bind(this)]);
      } else {
        this.delivererSearchControl.setValidators(null);
      }
      this.delivererSearchControl.updateValueAndValidity({ emitEvent: false });
    });
  }

  ngOnInit() {
    this.loadClients();
    this.loadDeliverers();

    this.clientSearchControl.valueChanges.subscribe(client => {
      if (client && client.id) {
        this.visitForm.patchValue({
          clientId: client.id
        });
      }
    });

    this.delivererSearchControl.valueChanges.subscribe(deliverer => {
      if (deliverer && deliverer.email) {
        this.visitForm.patchValue({
          delivererId: deliverer.email
        });
      }
    });
  }

  private parseDate(dateString: string): Date {
    if (!dateString) return new Date();
    const [datePart] = dateString.split('T');
    const [day, month, year] = datePart.split('/');
    return new Date(+year, +month - 1, +day);
  }

  private parseTime(dateString: string): string {
    if (!dateString) return '';
    const [, timePart] = dateString.split('T');
    return timePart || '';
  }

  private _filterClients(value: any): Client[] {
    const filterValue = typeof value === 'string' ? value.toLowerCase() : '';
    return this.clients.filter(client => 
      client.address.toLowerCase().includes(filterValue)
    );
  }

  private _filterDeliverers(value: any): any[] {
    const filterValue = typeof value === 'string' ? value.toLowerCase() : '';
    return this.deliverers.filter(deliverer => 
      deliverer.name.toLowerCase().includes(filterValue) ||
      deliverer.email.toLowerCase().includes(filterValue)
    );
  }

  displayClient(client: Client): string {
    return client ? client.address : '';
  }

  displayDeliverer(deliverer: any): string {
    return deliverer ? deliverer.name : '';
  }

  loadClients() {
    this.clientService.getClients().subscribe({
      next: (clients) => {
        this.clients = clients;
      },
      error: (error) => {
        console.error('Error loading clients:', error);
      }
    });
  }

  loadDeliverers() {
    this.delivererService.getDeliverers().subscribe({
      next: (deliverers) => {
        this.deliverers = deliverers.filter(d => d.active);
      },
      error: (error) => {
        console.error('Error loading deliverers:', error);
      }
    });
  }

  onSubmit() {
    if (this.visitForm.valid && 
        this.clientSearchControl.valid && 
        this.delivererSearchControl.valid) {
      const formValue = this.visitForm.value;
      const date = new Date(formValue.date);
      const [hours, minutes] = formValue.time.split(':');
    
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      const formattedTime = `${hours}:${minutes}`;
      
      const formattedDate = `${day}/${month}/${year}T${formattedTime}`;
      const selectedDeliverer = this.delivererSearchControl.value;
      
      const visitData = {
        clientId: formValue.clientId,
        delivererEmail: selectedDeliverer.email,
        date: formattedDate
      };

      this.visitService.updateVisit(this.data.deliverId, visitData).subscribe({
        next: () => {
          this.snackBar.open('Visita actualizada exitosamente', 'Cerrar', {
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'top'
          });
          this.dialogRef.close(true);
        },
        error: (error) => {
          console.error('Error updating visit:', error);
          this.snackBar.open('Error al actualizar la visita', 'Cerrar', {
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'top'
          });
        }
      });
    }
  }

  onCancel() {
    this.dialogRef.close();
  }

  private validateClientSelection(control: AbstractControl): ValidationErrors | null {
    if (typeof control.value === 'string' && control.value !== '') {
      return { invalidSelection: true };
    }
    return null;
  }

  private validateDelivererSelection(control: AbstractControl): ValidationErrors | null {
    if (typeof control.value === 'string' && control.value !== '') {
      return { invalidSelection: true };
    }
    return null;
  }

  private validateTime(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;

    const time = control.value;
    const [hours, minutes] = time.split(':').map(Number);
    const date = this.visitForm.get('date')?.value;

    if (!date) return null;

    const dayOfWeek = new Date(date).getDay();
    
    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      if (hours < 9 || hours > 16 || (hours === 16 && minutes > 0)) {
        return { invalidTime: true };
      }
    }
  
    if (dayOfWeek === 6) {
      if (hours < 9 || hours > 13 || (hours === 13 && minutes > 0)) {
        return { invalidTime: true };
      }
    }

    return null;
  }

  dateFilter = (date: Date | null): boolean => {
    if (!date) return false;
    const day = date.getDay();
    return day !== 0;
  };
}