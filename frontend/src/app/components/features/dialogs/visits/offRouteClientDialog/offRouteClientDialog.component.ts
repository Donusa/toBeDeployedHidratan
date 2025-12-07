import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Client } from '../../../../../interfaces/client.interface';
import { ClientService } from '../../../../../services/clientService/client.service';

@Component({
  selector: 'app-offroute-client-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatTableModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './offRouteClientDialog.component.html',
  styleUrl: './offRouteClientDialog.component.css'
})
export class OffRouteClientDialogComponent implements OnInit {
  displayedColumns: string[] = ['address', 'phoneNumber', 'debt'];
  dataSource = new MatTableDataSource<Client>([]);
  isLoading = true;

  constructor(
    private dialogRef: MatDialogRef<OffRouteClientDialogComponent>,
    private clientService: ClientService
  ) {}

  ngOnInit(): void {
    this.clientService.getClients().subscribe({
      next: (clients) => {
        this.dataSource.data = clients;
        this.dataSource.filterPredicate = (data: Client, filter: string) => {
          const q = (filter || '').trim();
          return this.tokenMatch(q, data.address, data.phoneNumber, data.zone, data.observations);
        };
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim();
  }

  selectClient(client: Client): void {
    this.dialogRef.close(client);
  }

  onCancel(): void {
    this.dialogRef.close();
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
}
