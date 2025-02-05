import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatBadgeModule } from '@angular/material/badge';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { NotificationService } from '../../../../services/notificationService/notification.service';

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [
    CommonModule,
    MatBadgeModule,
    MatIconModule,
    MatMenuModule,
    MatButtonModule
  ],
  template: `
    <button mat-icon-button 
            [matMenuTriggerFor]="notificationMenu"
            [attr.aria-label]="'Notificaciones' + (unreadCount > 0 ? ', ' + unreadCount + ' sin leer' : '')">
      <mat-icon [matBadge]="unreadCount" 
                [matBadgeHidden]="unreadCount === 0" 
                matBadgeColor="warn"
                matBadgeSize="small"
                aria-hidden="false"
                [attr.aria-label]="'Icono de notificaciones'">
        notifications
      </mat-icon>
    </button>

    <mat-menu #notificationMenu="matMenu" class="notification-menu">
      <div class="notification-header">
        <h3>Notificaciones</h3>
        <button mat-button *ngIf="notifications.length > 0" 
                (click)="clearAll()">
          Limpiar todo
        </button>
      </div>

      <div class="notification-list">
        <div *ngFor="let notification of notifications" 
             class="notification-item"
             [class.unread]="!notification.read"
             (click)="markAsRead(notification.id)">
          <mat-icon [class]="notification.type">
            {{getIconForType(notification.type)}}
          </mat-icon>
          <div class="notification-content">
            <p>{{notification.message}}</p>
            <small>{{notification.timestamp | date:'short'}}</small>
          </div>
          <button mat-icon-button (click)="removeNotification(notification.id, $event)">
            <mat-icon>close</mat-icon>
          </button>
        </div>

        <div *ngIf="notifications.length === 0" class="no-notifications">
          <mat-icon>notifications_off</mat-icon>
          <p>No hay notificaciones</p>
        </div>
      </div>
    </mat-menu>
  `,
  styles: [`
    :host {
      display: inline-block;
    }

    .notification-menu {
      width: 350px;
      max-width: 90vw;
    }

    .notification-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 16px;
      border-bottom: 1px solid #eee;
    }

    .notification-header h3 {
      margin: 0;
      font-size: 16px;
    }

    .notification-item {
      display: flex;
      align-items: start;
      padding: 12px 16px;
      border-bottom: 1px solid #eee;
      cursor: pointer;
    }

    .notification-item.unread {
      background: #f8f9fa;
    }

    .notification-content {
      flex: 1;
      margin: 0 12px;
    }

    .notification-content p {
      margin: 0;
      font-size: 14px;
    }

    .notification-content small {
      color: #666;
      font-size: 12px;
    }

    .no-notifications {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 24px;
      color: #666;
    }

    mat-icon.warning { color: #ff9800; }
    mat-icon.error { color: #f44336; }
    mat-icon.success { color: #4caf50; }
    mat-icon.info { color: #2196f3; }
  `]
})
export class NotificationBellComponent implements OnInit {
  notifications: any[] = [];
  unreadCount = 0;

  constructor(private notificationService: NotificationService) {}

  ngOnInit() {
    this.notificationService.notifications$.subscribe(
      notifications => {
        this.notifications = notifications;
        this.unreadCount = notifications.filter(n => !n.read).length;
      }
    );
  }

  getIconForType(type: string): string {
    const icons = {
      warning: 'warning',
      error: 'error',
      success: 'check_circle',
      info: 'info'
    };
    return icons[type as keyof typeof icons] || 'notifications';
  }

  markAsRead(id: string) {
    this.notificationService.markAsRead(id);
  }

  removeNotification(id: string, event: Event) {
    event.stopPropagation();
    this.notificationService.removeNotification(id);
  }

  clearAll() {
    this.notificationService.clearAll();
  }
} 