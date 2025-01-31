import { Injectable } from "@angular/core";

import { MatSnackBar } from "@angular/material/snack-bar";

@Injectable({
    providedIn: 'root'
})
export class NotificationService {
    constructor(private snackBar: MatSnackBar) {}

    notifyAdmin(visits: any[]): void {
        const message = `El repartidor tiene ${visits.length} visitas asignadas. Por favor, edítalas.`;
        this.snackBar.open(message, 'Cerrar', {
            duration: 5000,
            horizontalPosition: 'end',
            verticalPosition: 'top'
        });
    }
} 