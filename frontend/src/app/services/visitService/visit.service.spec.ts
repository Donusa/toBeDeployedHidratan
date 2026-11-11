import { HttpClient, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { VisitCompletion, VisitService } from './visit.service';

describe('VisitService visit submission API', () => {
  let service: VisitService;
  let http: HttpTestingController;
  const apiUrl = `${environment.apiUrl}${environment.endpoints.delivery.base}`;
  const movements: VisitCompletion = {
    deliveries: [{ productId: 1, quantity: 2 }],
    returns: [{ productId: 3, quantity: 3 }],
    paymentAmount: 40
  };

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = new VisitService(TestBed.inject(HttpClient), {} as any, 'server', {} as any);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('sends all movements in the completion request body', () => {
    service.completeVisit(12, movements).subscribe();

    const request = http.expectOne(`${apiUrl}/12/complete`);
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual(movements);
    request.flush({ status: 'COMPLETED' });
  });

  it('retains support for completing a visit with no movements', () => {
    service.completeVisit(12).subscribe();

    const request = http.expectOne(`${apiUrl}/12/complete`);
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual({ deliveries: [], returns: [], paymentAmount: 0 });
    request.flush({ status: 'COMPLETED' });
  });

  it('sends off-route movements with the client, deliverer and retry identifier', () => {
    const visit = {
      ...movements,
      clientId: 7,
      deliveryManEmail: 'repartidor@example.com',
      operationId: 'retry-operation'
    };

    service.registerOffRouteVisit(visit).subscribe();

    const request = http.expectOne(`${apiUrl}/off-route`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(visit);
    request.flush(null);
  });

  it('rejects a missing visit identifier before sending a request', () => {
    let message = '';
    service.completeVisit(0, movements).subscribe({ error: error => message = error.message });

    expect(message).toBe('ID de visita no válido');
    http.expectNone(`${apiUrl}/0/complete`);
  });
});
