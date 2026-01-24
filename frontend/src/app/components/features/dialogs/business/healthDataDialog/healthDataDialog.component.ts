import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { QRCodeComponent } from 'angularx-qrcode';

@Component({
  selector: 'app-health-data-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    MatIconModule,
    QRCodeComponent
  ],
  templateUrl: './healthDataDialog.component.html',
  styleUrls: ['./healthDataDialog.component.css']
})
export class HealthDataDialogComponent {
  healthData: string = '';
  qrData: string | null = null;
  generatedLink: string = '';

  constructor(
    private dialogRef: MatDialogRef<HealthDataDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    if (data && data.healthData) {
      this.healthData = data.healthData;
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    // Here you would typically save the data or pass it back
    console.log('Health Data to save:', this.healthData);
    this.dialogRef.close(this.healthData);
  }

  generateQR(): void {
    if (!this.healthData) return;
    const encodedData = this.utf8_to_b64(this.healthData);
    // Use window.location.origin to get current host
    const origin = window.location.origin;
    this.generatedLink = `${origin}/public/health-info?d=${encodedData}`;
    this.qrData = this.generatedLink;
  }

  private utf8_to_b64(str: string) {
    return window.btoa(unescape(encodeURIComponent(str)));
  }
}
