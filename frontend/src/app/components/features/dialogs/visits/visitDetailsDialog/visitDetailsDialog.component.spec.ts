import { DatePipe } from '@angular/common';
import { of, Subject, throwError } from 'rxjs';
import { DeliveryViewResponse } from '../../../../../interfaces/DeliveryViewResponse.interface';
import { VisitDetailsDialogComponent } from './visitDetailsDialog.component';

describe('VisitDetailsDialogComponent visit submission', () => {
  let component: VisitDetailsDialogComponent;
  let data: DeliveryViewResponse;
  let visitService: jasmine.SpyObj<any>;
  let dialog: jasmine.SpyObj<any>;
  let dialogRef: { close: jasmine.Spy; disableClose: boolean };

  beforeEach(() => {
    data = {
      client: { id: 7, address: 'Cliente', frecuency: 7, debt: 100, phoneNumber: '', clientStock: [] },
      deliverId: 12,
      delivererName: 'Repartidor',
      delivererEmail: 'repartidor@example.com',
      status: 'PENDING',
      deliveryDate: '04/11/2026T09:00',
      uniqueVisit: false
    };
    visitService = jasmine.createSpyObj('VisitService', [
      'completeVisit', 'registerOffRouteVisit', 'createVisit', 'transferProduct', 'returnProduct', 'processPayment'
    ]);
    visitService.completeVisit.and.returnValue(of({}));
    visitService.registerOffRouteVisit.and.returnValue(of(undefined));
    dialog = jasmine.createSpyObj('MatDialog', ['open']);
    dialogRef = { close: jasmine.createSpy('close'), disableClose: false };
    component = new VisitDetailsDialogComponent(
      dialogRef as any, data, { isAdmin: () => true } as any, new DatePipe('en-US'),
      dialog, visitService, jasmine.createSpyObj('MatSnackBar', ['open']),
      {} as any, {} as any, {} as any, 'server'
    );
    spyOn(console, 'error');
  });

  it('submits all deliveries, returns and payment together without separate event or scheduling requests', () => {
    component.deliveryProducts.data = [
      { product: { id: 1, price: 25 }, quantity: 2 },
      { product: { id: 2, price: 10 }, quantity: 1 }
    ];
    component.returnProducts.data = [{ product: { id: 3 }, quantity: 3 }];
    component.currentPayment = 40;

    component.onSave();

    expect(visitService.completeVisit).toHaveBeenCalledOnceWith(12, {
      deliveries: [{ productId: 1, quantity: 2 }, { productId: 2, quantity: 1 }],
      returns: [{ productId: 3, quantity: 3 }],
      paymentAmount: 40
    });
    expect(visitService.createVisit).not.toHaveBeenCalled();
    expect(visitService.transferProduct).not.toHaveBeenCalled();
    expect(visitService.returnProduct).not.toHaveBeenCalled();
    expect(visitService.processPayment).not.toHaveBeenCalled();
    expect(dialogRef.close).toHaveBeenCalledOnceWith(true);
    expect(data.status).toBe('COMPLETED');
  });

  it('ignores a second save while the first request is pending', () => {
    const pending = new Subject<object>();
    visitService.completeVisit.and.returnValue(pending);

    component.onSave();
    component.onSave();

    expect(visitService.completeVisit).toHaveBeenCalledTimes(1);
    expect(component.isSaving).toBeTrue();
    expect(dialogRef.disableClose).toBeTrue();
    expect(dialogRef.close).not.toHaveBeenCalled();

    pending.next({});
    pending.complete();

    expect(component.isSaving).toBeFalse();
    expect(dialogRef.disableClose).toBeFalse();
    component.onSave();
    expect(visitService.completeVisit).toHaveBeenCalledTimes(1);
  });

  it('allows retry after an error without marking the visit completed', () => {
    visitService.completeVisit.and.returnValues(throwError(() => new Error('network')), of({}));

    component.onSave();

    expect(component.isSaving).toBeFalse();
    expect(dialogRef.disableClose).toBeFalse();
    expect(data.status).toBe('PENDING');
    expect(dialogRef.close).not.toHaveBeenCalled();

    component.onSave();

    expect(visitService.completeVisit).toHaveBeenCalledTimes(2);
    expect(data.status).toBe('COMPLETED');
  });

  it('reuses the same operation identifier when an off-route submission is retried', () => {
    component.offRoute = true;
    component.returnProducts.data = [{ product: { id: 3 }, quantity: 3 }];
    component.currentPayment = 20;
    visitService.registerOffRouteVisit.and.returnValues(throwError(() => new Error('network')), of(undefined));

    component.onSave();
    component.onSave();

    const first = visitService.registerOffRouteVisit.calls.argsFor(0)[0];
    const retry = visitService.registerOffRouteVisit.calls.argsFor(1)[0];
    expect(first.operationId).toEqual(jasmine.any(String));
    expect(first.operationId.length).toBeGreaterThan(0);
    expect(retry).toEqual(first);
    expect(first.clientId).toBe(7);
    expect(first.deliveryManEmail).toBe('repartidor@example.com');
    expect(first.returns).toEqual([{ productId: 3, quantity: 3 }]);
    expect(first.paymentAmount).toBe(20);
    expect(visitService.completeVisit).not.toHaveBeenCalled();
    expect(visitService.createVisit).not.toHaveBeenCalled();
  });

  it('preserves accumulated payments when products are added and removed afterwards', () => {
    component.deliveryProducts.data = [{ product: { id: 1, price: 50 }, quantity: 2 }];
    component.calculateDebt();
    dialog.open.and.returnValues(
      { afterClosed: () => of({ amount: 20 }) },
      { afterClosed: () => of({ amount: 30 }) },
      { afterClosed: () => of({ product: { id: 2, price: 25 }, quantity: 2 }) }
    );

    component.addPayment();
    component.addPayment();

    expect(component.currentPayment).toBe(50);
    expect(component.totalDebt).toBe(150);

    component.addProduct('delivery');

    expect(component.currentPayment).toBe(50);
    expect(component.currentDebt).toBe(150);
    expect(component.totalDebt).toBe(200);

    component.removeProduct(0, 'delivery');

    expect(component.currentPayment).toBe(50);
    expect(component.currentDebt).toBe(50);
    expect(component.totalDebt).toBe(100);
  });

  it('does not submit visits that are already completed or cancelled', () => {
    data.status = 'COMPLETED';
    component.onSave();
    data.status = 'CANCELLED';
    component.onSave();

    expect(visitService.completeVisit).not.toHaveBeenCalled();
    expect(visitService.registerOffRouteVisit).not.toHaveBeenCalled();
  });
});
