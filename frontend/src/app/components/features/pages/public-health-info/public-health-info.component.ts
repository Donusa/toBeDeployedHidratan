import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { HealthDataService } from '../../../../services/healthDataService/health-data.service';

@Component({
  selector: 'app-public-health-info',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatButtonModule],
  template: `
    <div class="container">
      <mat-card class="info-card">
        <mat-card-header>
          <div mat-card-avatar class="avatar-container">
            <mat-icon>health_and_safety</mat-icon>
          </div>
          <mat-card-title>Información Sanitaria</mat-card-title>
          <mat-card-subtitle>Datos públicos del negocio</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <div *ngIf="isLoading" class="loading-container">
            <p>Cargando información...</p>
          </div>
          <div *ngIf="!isLoading && healthData; else noData" class="data-content">
            <pre>{{ healthData }}</pre>
          </div>
          <ng-template #noData>
            <div *ngIf="!isLoading" class="no-data">
              <mat-icon>error_outline</mat-icon>
              <p>No se encontró información sanitaria o el enlace es inválido.</p>
            </div>
          </ng-template>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .container {
      display: flex;
      justify-content: center;
      padding: 20px;
      min-height: 100vh;
      background-color: #f5f5f5;
      box-sizing: border-box;
    }
    .info-card {
      width: 100%;
      max-width: 600px;
      margin-top: 20px;
      height: fit-content;
    }
    .avatar-container {
        background-color: #3f51b5;
        border-radius: 50%;
        display: flex;
        justify-content: center;
        align-items: center;
        color: white;
    }
    .data-content {
      margin-top: 20px;
      padding: 15px;
      background-color: #fafafa;
      border-radius: 4px;
      border: 1px solid #eee;
    }
    pre {
      white-space: pre-wrap;
      font-family: Roboto, "Helvetica Neue", sans-serif;
      margin: 0;
      color: #333;
      line-height: 1.5;
      font-size: 16px;
    }
    .no-data, .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 40px 0;
      color: #666;
    }
    .no-data mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      margin-bottom: 16px;
      color: #999;
    }
    mat-card-header {
      margin-bottom: 16px;
    }
  `]
})
export class PublicHealthInfoComponent implements OnInit {
  healthData: string = '';
  isLoading: boolean = true;

  constructor(
    private route: ActivatedRoute,
    private healthDataService: HealthDataService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.loadHealthData();
    } else {
      this.isLoading = false;
    }
  }

  private loadHealthData() {
    this.checkQueryParams();
  }

  private checkQueryParams() {
    this.route.queryParams.subscribe(params => {
      if (params['d']) {
        try {
          this.healthData = this.b64_to_utf8(params['d']);
        } catch (e) {
          console.error('Error decoding data', e);
          this.healthData = '';
        }
      }
      this.isLoading = false;
    });
  }

  private b64_to_utf8(str: string) {
    if (isPlatformBrowser(this.platformId)) {
      try {
        return decodeURIComponent(escape(window.atob(str)));
      } catch (e) {
        console.error('Decoding failed', e);
        return '';
      }
    }
    return '';
  }
}
