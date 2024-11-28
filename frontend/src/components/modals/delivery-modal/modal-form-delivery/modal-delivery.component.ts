import { Component, OnInit, Inject, ViewChild, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { StockService } from 'src/app/services/stockService/stock-service';
import { ClientService } from 'src/app/services/clientService/client.service';
import { DeliveryManagementService } from 'src/app/services/delivery-managementService/delivery-management-service';
import { Delivery } from 'src/interfaces/delivery.interface';
import { forkJoin } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DatePipe } from '@angular/common';
import { NgxMaterialTimepickerModule } from 'ngx-material-timepicker';
import { DeliveryViewResponse } from 'src/interfaces/DeliveryViewResponse.interface';
import { ClientProduct } from 'src/interfaces/client.interface';

@Component({
  selector: 'app-modal-delivery',
  templateUrl: './modal-delivery.component.html',
  styleUrls: ['./modal-delivery.component.css'],
  providers: [DatePipe, NgxMaterialTimepickerModule]
})
export class ModalDeliveryComponent implements OnInit {
  deliveryForm: FormGroup = this.fb.group({
    clientName: ['', Validators.required],
    assignedTo: ['', Validators.required],
    nextVisit: ['', Validators.required],
    deliveryTime: ['', [Validators.required]],
    hasStock: [false],
    products: this.fb.array([])
  });
  stockProducts: any[] = [];
  clients: any[] = [];
  deliveryPersonnel: any[] = [];
  isLoading = false;
  @ViewChild(MatSnackBar) snackBar!: MatSnackBar;
  minDate: Date = new Date();
  isEditMode: boolean = false;

  dateFilter = (date: Date | null): boolean => {
    if (!date) return false;
    const day = date.getDay();
    return day !== 0; 
  };

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<ModalDeliveryComponent>,
    private stockService: StockService,
    private clientService: ClientService,
    private deliveryService: DeliveryManagementService,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private datePipe: DatePipe,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit() {
    if (this.data?.isEdit) {
      this.isEditMode = true;
    }

    this.deliveryForm.get('nextVisit')?.valueChanges.subscribe(() => {
      this.validateDeliveryTime();
    });

    this.deliveryForm.get('deliveryTime')?.valueChanges.subscribe(() => {
      this.validateDeliveryTime();
    });
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.loadInitialData().then(() => {
        if (this.data?.isEdit) {
          this.populateForm(this.data.delivery);
        } else {
          this.addProduct();
        }
        this.cd.detectChanges();
      });
    });
  }

  private async loadInitialData(): Promise<void> {
    this.isLoading = true;
    this.updateFormControlsState(true);
    
    try {
      const data = await forkJoin({
        clients: this.clientService.getClients(),
        personnel: this.deliveryService.getDeliveryPersons(),
        products: this.stockService.getProducts()
      }).toPromise();

      if (data) {
        this.clients = data.clients;
        this.deliveryPersonnel = data.personnel;
        this.stockProducts = data.products;
      }
    } catch (error) {
      // Error handling can be added here if needed
    } finally {
      this.isLoading = false;
      this.updateFormControlsState(false);
      this.cd.detectChanges();
    }
  }

  private updateFormControlsState(disabled: boolean) {
    const formControls = this.deliveryForm.controls;
    Object.keys(formControls).forEach(key => {
      const control = formControls[key];
      disabled ? control.disable() : control.enable();
    });
  }

  getProductControls() {
    return (this.deliveryForm.get('products') as FormArray).controls;
  }

  getProductControl(index: number) {
    return (this.deliveryForm.get('products') as FormArray).at(index);
  }

  addProduct() {
    const products = this.deliveryForm.get('products') as FormArray;
    products.push(this.createProductFormGroup());
  }

  removeProduct(index: number) {
    const products = this.deliveryForm.get('products') as FormArray;
    if (products.length > 1) {
      products.removeAt(index);
    } else {
      products.reset();
    }
  }

  private createProductFormGroup() {
    return this.fb.group({
      name: [{value: '', disabled: false}, Validators.required],
      stock: [0, [Validators.required, Validators.min(0)]]
    });
  }

  getMaxStock(index: number): number {
    const productControl = this.getProductControl(index);
    const selectedProduct = this.stockProducts.find(
      p => p.name === productControl.get('name')?.value
    );
    return selectedProduct?.stock || 0;
  }

  onSubmit() {
    if (this.deliveryForm.valid) {
      this.isLoading = true;
      this.cd.detectChanges(); // Forzar detección de cambios antes de continuar
      
      this.loadAllData().subscribe({
        next: (data) => {
          const formValue = this.deliveryForm.value;
          const selectedClient = this.clients.find(c => c.name === formValue.clientName);

          if (!selectedClient) {
            this.isLoading = false;
            return;
          }

          const selectedProducts = formValue.products
            .filter((p: any) => p.name && p.stock > 0)
            .map((p: any) => {
              const product = this.stockProducts.find(sp => sp.name === p.name);
              return {
                ...product,
                stock: p.stock
              };
            });

          const delivery: Delivery = {
            client: selectedClient,
            assignedTo: formValue.assignedTo,
            status: 'Pendiente',
            deliveryDate: this.formatDateToString(
              formValue.nextVisit, 
              formValue.deliveryTime
            ),
            products: selectedProducts
          };

          this.dialogRef.close(delivery);
        },
        error: (error) => {
          this.isLoading = false;
          this.snackBar.open('Error al cargar los datos', 'Cerrar', {
            duration: 3000,
            panelClass: ['error-snackbar']
          });
        }
      });
    }
  }

  onClose() {
    this.dialogRef.close();
  }

  private formatDateToString(date: Date, time: string): string {
    if (!date || !time) return '';
    const formattedDate = this.datePipe.transform(date, 'dd/MM/yyyy');
    return `${formattedDate}T${time}`;
  }

  private loadAllData() {
    this.isLoading = true;
    return forkJoin({
      clients: this.clientService.getClients(),
      personnel: this.deliveryService.getDeliveryPersons(),
      products: this.stockService.getProducts()
    });
  }

  private populateForm(delivery: DeliveryViewResponse) {
    this.deliveryForm.patchValue({
      clientName: delivery.client.name,
      assignedTo: delivery.delivererEmail,
      nextVisit: this.parseDeliveryDate(delivery.deliveryDate),
      deliveryTime: this.parseDeliveryTime(delivery.deliveryDate)
    });

    // Populate products
    const productsArray = this.deliveryForm.get('products') as FormArray;
    delivery.client.clientProducts.forEach((product: ClientProduct) => {
      productsArray.push(this.fb.group({
        name: [product.product.name, Validators.required],
        stock: [product.quantity, [Validators.required, Validators.min(0)]]
      }));
    });
  }

  private parseDeliveryDate(dateTimeString: string): Date {
    const [datePart] = dateTimeString.split('T');
    const [day, month, year] = datePart.split('/');
    return new Date(+year, +month - 1, +day);
  }

  private parseDeliveryTime(dateTimeString: string): string {
    const [, timePart] = dateTimeString.split('T');
    return timePart || '';
  }

  isValidDeliveryTime(date: Date, time: string): boolean {
    const dayOfWeek = date.getDay();
    const [hours, minutes] = time.split(':').map(Number);
    
    // Sunday (0)
    if (dayOfWeek === 0) {
      return false;
    }
    
    // Monday to Friday (1-5)
    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      return (hours >= 9 && hours < 18) || (hours === 18 && minutes === 0);
    }
    
    // Saturday (6)
    if (dayOfWeek === 6) {
      return (hours >= 9 && hours < 13) || (hours === 13 && minutes === 0);
    }
    
    return false;
  }

  validateDeliveryTime(): void {
    const date = this.deliveryForm.get('nextVisit')?.value;
    const time = this.deliveryForm.get('deliveryTime')?.value;
    
    if (date && time) {
      const isValid = this.isValidDeliveryTime(date, time);
      const timeControl = this.deliveryForm.get('deliveryTime');
      
      if (!isValid) {
        timeControl?.setErrors({ invalidTime: true });
      } else {
        const currentErrors = timeControl?.errors;
        if (currentErrors) {
          delete currentErrors['invalidTime'];
          timeControl?.setErrors(Object.keys(currentErrors).length ? currentErrors : null);
        }
      }
    }
  }



}