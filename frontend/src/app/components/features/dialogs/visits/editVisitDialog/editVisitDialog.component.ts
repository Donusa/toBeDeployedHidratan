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
    @Inject(MAT_DIALOG_DATA) public data: any,
    private formBuilder: FormBuilder,
    private clientService: ClientService,
    private delivererService: DelivererService,
    private visitService: VisitService,
    private snackBar: MatSnackBar
  ) {
    const [datePart, timePart] = data.date.split('T');
    const [day, month, year] = datePart.split('/');
    const dateObj = new Date(+year, +month - 1, +day);

    this.visitForm = this.formBuilder.group({
      clientId: [data.client.id, Validators.required],
      delivererId: [data.deliverer.email, Validators.required],
      date: [dateObj, Validators.required],
      time: [timePart, Validators.required]
    });

    this.clientSearchControl = new FormControl(data.client);
    
    this.delivererSearchControl = new FormControl({
      email: data.deliverer.email,
      name: data.deliverer.name,
      active: true
    });

    this.filteredClients = this.clientSearchControl.valueChanges.pipe(
      startWith(data.client),
      map(value => this._filterClients(value))
    );

    this.filteredDeliverers = this.delivererSearchControl.valueChanges.pipe(
      startWith({
        email: data.deliverer.email,
        name: data.deliverer.name,
        active: true
      }),
      map(value => this._filterDeliverers(value))
    );

    this.setupValidators();
  }

  private setupValidators(): void {
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

  private normalize(s: string): string {
    return (s ?? '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }

  private tokenMatch(query: string, ...fields: Array<string | number | null | undefined>): boolean {
    const tokens = this.normalize(query).split(/\s+/).filter(Boolean);
    const haystack = this.normalize(fields.map(v => String(v ?? '')).join(' '));
    return tokens.every(t => haystack.includes(t));
  }

  private _filterClients(value: any): Client[] {
    const q = typeof value === 'string' ? value : '';
    return this.clients.filter(client =>
      this.tokenMatch(q, client.address, client.phoneNumber, client.zone, client.observations)
    );
  }

  private _filterDeliverers(value: any): any[] {
    const q = typeof value === 'string' ? value : '';
    return this.deliverers.filter(deliverer =>
      this.tokenMatch(q, deliverer.name, deliverer.email)
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
}
