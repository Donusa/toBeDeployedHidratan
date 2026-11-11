import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormGroup, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule, DateAdapter, NativeDateAdapter, MAT_DATE_LOCALE, MAT_DATE_FORMATS } from '@angular/material/core';
import { MatAutocompleteModule, MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { ClientService } from '../../../../../services/clientService/client.service';
import { DelivererService } from '../../../../../services/delivererService/deliverer.service';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { Client } from '../../../../../interfaces/client.interface';
import { VisitService } from '../../../../../services/visitService/visit.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-new-visit-dialog',
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
    MatAutocompleteModule,
    MatCheckboxModule
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
  templateUrl: './newVisitDialog.component.html',
  styleUrls: ['./newVisitDialog.component.css']
})
export class NewVisitDialogComponent implements OnInit {
  visitForm: FormGroup;
  clientSearchControl = new FormControl();
  delivererSearchControl = new FormControl();
  filteredClients: Observable<Client[]>;
  filteredDeliverers: Observable<any[]>;
  clients: Client[] = [];
  deliverers: any[] = [];
  private isSubmitting = false;

  constructor(
    private dialogRef: MatDialogRef<NewVisitDialogComponent>,
    private formBuilder: FormBuilder,
    private clientService: ClientService,
    private delivererService: DelivererService,
    private visitService: VisitService,
    private snackBar: MatSnackBar
  ) {
    this.visitForm = this.formBuilder.group({
      clientId: ['', Validators.required],
      delivererId: ['', Validators.required],
      date: [new Date(), [Validators.required]],
      time: [this.getCurrentTime(), Validators.required],
      uniqueVisit: [false]
    });

    this.filteredClients = this.clientSearchControl.valueChanges.pipe(
      startWith(''),
      map(value => this._filterClients(value))
    );

    this.filteredDeliverers = this.delivererSearchControl.valueChanges.pipe(
      startWith(''),
      map(value => this._filterDeliverers(value))
    );
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

  ngOnInit() {
    this.loadClients();
    this.loadDeliverers();

    this.clientSearchControl.setValidators([
      Validators.required,
      this.validateSelection.bind(this)
    ]);

    this.delivererSearchControl.setValidators([
      Validators.required,
      this.validateSelection.bind(this)
    ]);

    this.clientSearchControl.valueChanges.subscribe(client => {
      if (client && client.id) {
        this.visitForm.patchValue({
          clientId: client.id
        });
      } else {
        this.visitForm.patchValue({
          clientId: null
        });
      }
    });

    this.delivererSearchControl.valueChanges.subscribe(deliverer => {
      if (deliverer && deliverer.email) {
        this.visitForm.patchValue({
          delivererId: deliverer.email
        });
      } else {
        this.visitForm.patchValue({
          delivererId: null
        });
      }
    });
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

  private getCurrentTime(): string {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  }

  onSubmit() {
    if (this.isSubmitting) return;
    
    this.clientSearchControl.markAsTouched();
    this.delivererSearchControl.markAsTouched();
    
    if (this.visitForm.valid && 
        this.clientSearchControl.valid && 
        !this.clientSearchControl.hasError('invalidSelection') &&
        this.delivererSearchControl.valid && 
        !this.delivererSearchControl.hasError('invalidSelection')) {
      this.isSubmitting = true;
      
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
        date: formattedDate,
        uniqueVisit: formValue.uniqueVisit
      };
      
      console.log('Submitting visit data:', visitData);

      this.visitService.createVisit(visitData).subscribe({
        next: () => {
          this.dialogRef.close(visitData);
        },
        error: (error) => {
          this.isSubmitting = false;
          console.error('Error creating visit:', error);
          this.snackBar.open('Error al crear la visita', 'Cerrar', {
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'top'
          });
        }
      });
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onFocus(trigger: MatAutocompleteTrigger): void {
    trigger.openPanel();
  }

  onClientSearchClick(trigger: MatAutocompleteTrigger): void {
    trigger.openPanel();
    
    if (!this.clientSearchControl.value) {
      this.clientSearchControl.setValue('');
      this.loadClients();
    }
  }

  private validateSelection(control: FormControl): {[key: string]: any} | null {
    const value = control.value;
    if (typeof value === 'string') {
      return { invalidSelection: true };
    }
    return null;
  }
}
