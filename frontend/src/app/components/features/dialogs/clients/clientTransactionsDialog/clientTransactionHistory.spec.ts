import { ClientTransaction, groupClientTransactions } from './clientTransactionHistory';

describe('groupClientTransactions', () => {
  function transaction(overrides: Partial<ClientTransaction> = {}): ClientTransaction {
    return {
      date: '2026-11-04T12:00:00Z',
      type: 'PRODUCT_DELIVERY',
      quantity: 2,
      amount: null,
      debtBefore: 100,
      debtAfter: 100,
      ...overrides
    };
  }

  it('keeps delivery, return and payment in the same visit entry', () => {
    const groups = groupClientTransactions([
      transaction({ id: 3, operationId: 'visit-a', deliveryId: 10, type: 'MONETARY_PAYMENT', amount: 50 }),
      transaction({ id: 2, operationId: 'visit-a', deliveryId: 10, type: 'PRODUCT_RETURN', quantity: 3 }),
      transaction({ id: 1, operationId: 'visit-a', deliveryId: 10 })
    ]);

    expect(groups.length).toBe(1);
    expect(groups[0].isVisit).toBeTrue();
    expect(groups[0].deliveryId).toBe(10);
    expect(groups[0].events.map(event => event.id)).toEqual([1, 2, 3]);
  });

  it('keeps distinct visits and legacy records separate at the same timestamp', () => {
    const groups = groupClientTransactions([
      transaction({ operationId: 'visit-a' }),
      transaction({ operationId: 'visit-b' }),
      transaction(),
      transaction()
    ]);

    expect(groups.length).toBe(4);
    expect(groups.map(group => group.isVisit)).toEqual([true, true, false, false]);
  });

  it('uses deliveryId when no operationId exists', () => {
    const groups = groupClientTransactions([
      transaction({ deliveryId: 10 }),
      transaction({ deliveryId: 10, type: 'PRODUCT_RETURN' }),
      transaction({ deliveryId: 11 })
    ]);

    expect(groups.map(group => group.events.length)).toEqual([2, 1]);
  });

  it('groups an off-route delivery by operationId without requiring a deliveryId', () => {
    const groups = groupClientTransactions([
      transaction({ operationId: 'off-route' }),
      transaction({ operationId: 'off-route', type: 'PRODUCT_RETURN' })
    ]);

    expect(groups.length).toBe(1);
    expect(groups[0].isVisit).toBeTrue();
    expect(groups[0].events.length).toBe(2);
  });

  it('filters zero payments and retains positive payments and previous negative debt entries', () => {
    const groups = groupClientTransactions([
      transaction({ type: 'MONETARY_PAYMENT', amount: 0 }),
      transaction({ type: 'MONETARY_PAYMENT', amount: 50 }),
      transaction({ type: 'MONETARY_PAYMENT', amount: -50 })
    ]);

    expect(groups.length).toBe(2);
    expect(groups.map(group => group.events[0].amount)).toEqual([50, -50]);
  });
});
