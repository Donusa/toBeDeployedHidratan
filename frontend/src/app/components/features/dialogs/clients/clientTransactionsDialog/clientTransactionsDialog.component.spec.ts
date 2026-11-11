import { TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { of, Subject, throwError } from 'rxjs';
import { AuthenticationService } from '../../../../../services/authentication.service';
import { ClientService } from '../../../../../services/clientService/client.service';
import { ClientTransaction } from './clientTransactionHistory';
import { ClientTransactionsDialogComponent } from './clientTransactionsDialog.component';

describe('ClientTransactionsDialogComponent history deletion', () => {
  const transaction: ClientTransaction = {
    date: '2026-11-04T12:00:00Z',
    type: 'PRODUCT_DELIVERY',
    amount: null,
    debtBefore: 100,
    debtAfter: 100
  };

  let clientService: jasmine.SpyObj<ClientService>;
  let confirmation: Subject<boolean>;
  let isAdmin: boolean;

  beforeEach(() => {
    isAdmin = true;
    confirmation = new Subject<boolean>();
    clientService = jasmine.createSpyObj<ClientService>('ClientService', [
      'getClientTransactions', 'deleteClientHistoryEntry'
    ]);
    clientService.getClientTransactions.and.returnValue(of([
      { ...transaction, id: 1, operationId: 'visit-a', deliveryId: 10 },
      { ...transaction, id: 2, operationId: 'visit-a', deliveryId: 10 },
      { ...transaction, id: 3 }
    ]));
    clientService.deleteClientHistoryEntry.and.returnValue(of(undefined));

    TestBed.configureTestingModule({
      imports: [ClientTransactionsDialogComponent],
      providers: [
        provideNoopAnimations(),
        { provide: MAT_DIALOG_DATA, useValue: { clientId: 7 } },
        { provide: MatDialogRef, useValue: {} },
        { provide: MatSnackBar, useValue: jasmine.createSpyObj('MatSnackBar', ['open']) },
        { provide: AuthenticationService, useValue: { isAdmin: () => isAdmin } },
        { provide: ClientService, useValue: clientService }
      ]
    });
    TestBed.overrideProvider(MatDialog, {
      useValue: { open: () => ({ afterClosed: () => confirmation }) }
    });
  });

  it('deletes only the selected entry after confirmation', () => {
    const fixture = TestBed.createComponent(ClientTransactionsDialogComponent);
    fixture.detectChanges();

    const button: HTMLButtonElement = fixture.nativeElement.querySelector('mat-action-row button');
    button.click();
    expect(clientService.deleteClientHistoryEntry).not.toHaveBeenCalled();

    confirmation.next(true);
    confirmation.complete();
    expect(clientService.deleteClientHistoryEntry).toHaveBeenCalledOnceWith(7, 1);
    expect(fixture.componentInstance.transactionGroups.map(group => group.events[0].id)).toEqual([3]);
  });

  it('does not offer deletion to a worker', () => {
    isAdmin = false;
    const fixture = TestBed.createComponent(ClientTransactionsDialogComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('mat-action-row button')).toBeNull();
  });

  it('keeps the entry and allows retry when deletion fails', () => {
    clientService.deleteClientHistoryEntry.and.returnValue(throwError(() => new Error('network')));
    const fixture = TestBed.createComponent(ClientTransactionsDialogComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;

    component.deleteHistoryEntry(component.transactionGroups[0]);
    confirmation.next(true);
    confirmation.complete();

    expect(component.transactionGroups.length).toBe(2);
    expect(component.isDeleting).toBeFalse();
  });
});
