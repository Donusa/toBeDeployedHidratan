import { Injectable } from "@angular/core";
import { BehaviorSubject, Observable } from "rxjs";

export interface Notification {
    id: string;
    message: string;
    type: 'warning' | 'info' | 'error' | 'success';
    timestamp: Date;
    read: boolean;
}

@Injectable({
    providedIn: 'root'
})
export class NotificationService {
    private notifications = new BehaviorSubject<Notification[]>([]);
    notifications$ = this.notifications.asObservable();

    notifyAdmin(visits: any[]): void {
        const notification: Notification = {
            id: this.generateId(),
            message: `El repartidor tiene ${visits.length} visitas asignadas. Por favor, edítalas.`,
            type: 'warning',
            timestamp: new Date(),
            read: false
        };
        this.addNotification(notification);
    }

    notifyPendingDeliveries(deliveries: any[]): void {
        const message = deliveries.length > 0 
            ? `El repartidor ha sido dado de baja. Los siguientes repartos necesitan ser editados: ${deliveries.map(delivery => delivery.id).join(', ')}.` 
            : 'No hay repartos pendientes para este repartidor.';
        
        const notification: Notification = {
            id: this.generateId(),
            message,
            type: deliveries.length > 0 ? 'warning' : 'info',
            timestamp: new Date(),
            read: false
        };
        this.addNotification(notification);
    }

    notifyDelivererDisabled(delivererName: string, deliveries: any[]): void {
        const message = `El repartidor ${delivererName} ha sido dado de baja, deberá modificar sus repartos`;
        
        const notification: Notification = {
            id: this.generateId(),
            message,
            type: 'warning',
            timestamp: new Date(),
            read: false
        };
        this.addNotification(notification);
    }

    private addNotification(notification: Notification): void {
        const current = this.notifications.getValue();
        this.notifications.next([notification, ...current]);
    }

    markAsRead(id: string): void {
        const current = this.notifications.getValue();
        const updated = current.map(notif => 
            notif.id === id ? { ...notif, read: true } : notif
        );
        this.notifications.next(updated);
    }

    removeNotification(id: string): void {
        const current = this.notifications.getValue();
        this.notifications.next(current.filter(notif => notif.id !== id));
    }

    clearAll(): void {
        this.notifications.next([]);
    }

    getUnreadCount(): Observable<number> {
        return new Observable<number>(observer => {
            this.notifications$.subscribe(notifications => {
                observer.next(notifications.filter(n => !n.read).length);
            });
        });
    }

    private generateId(): string {
        return Math.random().toString(36).substring(2) + Date.now().toString(36);
    }
} 