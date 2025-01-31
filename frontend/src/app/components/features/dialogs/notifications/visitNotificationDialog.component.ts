import { MatDialogRef } from "@angular/material/dialog";

import { Component } from "@angular/core";

import { MAT_DIALOG_DATA } from "@angular/material/dialog";

import { Inject } from "@angular/core";

@Component({
    selector: 'app-visit-notification-dialog',
    templateUrl: './visitNotificationDialog.component.html',
})
export class VisitNotificationDialogComponent {
    constructor(
        private dialogRef: MatDialogRef<VisitNotificationDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: any
    ) {}

    onClose(): void {
        this.dialogRef.close();
    }
} 