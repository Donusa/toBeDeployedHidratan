import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DeliveryPerson } from 'src/interfaces/delivery-person.interface';
import { DeliveryService } from 'src/app/services/deliveryService/delivery-service';
import { jsPDF } from 'jspdf';

import { DeliveryDto } from 'src/interfaces/deliveryDto.interface';
import 'jspdf-autotable';

@Component({
  selector: 'app-modal-worker-detail',
  templateUrl: './modal-worker-detail.component.html',
  styleUrls: ['./modal-worker-detail.component.css']
})
export class ModalWorkerDetailComponent {
  personForm: FormGroup;
  isAdmin: boolean;
  isEditing: boolean = false;

  constructor(
    private dialogRef: MatDialogRef<ModalWorkerDetailComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DeliveryPerson,
    private fb: FormBuilder,
    private deliveryService: DeliveryService
  ) {
    this.isAdmin = true;
    this.personForm = this.fb.group({
      name: [{value: data.name, disabled: !this.isEditing}, [Validators.required]],
      email: [{value: data.email, disabled: !this.isEditing}, [Validators.required, Validators.email]],
      active: [{value: data.active, disabled: true}]
    });
  }

  downloadDeliveriesPDF(): void {
    this.deliveryService.getDeliveriesToday(this.data.email).subscribe({
      next: (deliveries: DeliveryDto[]) => {
        const doc = new jsPDF();
        doc.text('Repartos del dia: '+deliveries[0].deliveryManEmail, 14, 16);
  
        const columns = ['ID', 'Fecha de Entrega', 'Estado', 'Email del Repartidor', 'Nombre del Cliente', 'Dirección', 'Producto', 'Cantidad'];

        let rows = [];
        for(let i = 0;i<deliveries.length;i++){
          for(let product of deliveries[i].deliveryProducts){
            const mod = deliveries[i].deliveryDate.replace('T', ' ');

            rows.push([
              deliveries[i].id,
              mod,
              deliveries[i].status,
              deliveries[i].deliveryManEmail,
              deliveries[i].clientName, 
              deliveries[i].address,
              product.productName,
              product.quantity
            ]);
          }
        }
        (doc as any).autoTable({
          head: [columns],
          body: rows,
          startY: 20,
        });
  
        doc.save('Repartos-'+deliveries[0].
          deliveryDate.substring(0,deliveries[0].deliveryDate.indexOf('T'))+
          '-'+
          deliveries[0].deliveryManEmail.substring(0,deliveries[0].deliveryManEmail.indexOf('@'))+
          '.pdf');
      },
    });
  }


  toggleEdit(): void {
    this.isEditing = !this.isEditing;
    if (this.isEditing) {
      this.personForm.get('name')?.enable();
      this.personForm.get('email')?.enable();
    } else {
      this.personForm.get('name')?.disable();
      this.personForm.get('email')?.disable();
    }
  }

  onSave(): void {
    if (this.personForm.valid) {
      const updatedPerson: DeliveryPerson = {
        ...this.data,
        name: this.personForm.get('name')?.value,
        email: this.personForm.get('email')?.value,
        role: 'ROLE_DELIVERY',
        active: this.data.active
      };
      
      this.dialogRef.close({
        action: 'edit',
        person: updatedPerson,
        originalEmail: this.data.email
      });
    }
  }

  onToggleStatus(): void {
    this.dialogRef.close({
      action: 'toggleStatus',
      person: this.data
    });
  }
  
  onCancel(): void {
    this.dialogRef.close();
  }
  
  onActivate(): void {
    const updatedPerson: DeliveryPerson = {
      ...this.data,
      name: this.personForm.get('name')?.value,
      email: this.data.email,
      role: 'ROLE_DELIVERY',
      active: true
    };
    
    this.dialogRef.close({
      action: 'edit',
      person: updatedPerson,
      originalEmail: this.data.email
    });
  }
}
