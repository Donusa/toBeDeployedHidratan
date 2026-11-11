export interface ClientTransaction {
  id?: number;
  operationId?: string | null;
  deliveryId?: number | null;
  date: string;
  type: string;
  product?: { name: string } | null;
  quantity?: number | null;
  amount: number | null;
  debtBefore: number | null;
  debtAfter: number | null;
}

export interface ClientTransactionGroup {
  key: string;
  date: string;
  deliveryId?: number | null;
  isVisit: boolean;
  events: ClientTransaction[];
}

export function groupClientTransactions(transactions: ClientTransaction[]): ClientTransactionGroup[] {
  const groups = new Map<string, ClientTransactionGroup>();

  transactions.forEach((transaction, index) => {
    if (transaction.type === 'MONETARY_PAYMENT' && transaction.amount === 0) return;

    const isVisit = !!transaction.operationId || transaction.deliveryId != null;
    const key = transaction.operationId
      ? `operation:${transaction.operationId}`
      : transaction.deliveryId != null
        ? `delivery:${transaction.deliveryId}`
        : `transaction:${index}`;

    let group = groups.get(key);
    if (!group) {
      group = {
        key,
        date: transaction.date,
        deliveryId: transaction.deliveryId,
        isVisit,
        events: []
      };
      groups.set(key, group);
    }
    group.events.push(transaction);
  });

  for (const group of groups.values()) {
    group.events.sort((left, right) => {
      if (left.id != null && right.id != null) return left.id - right.id;
      return new Date(left.date).getTime() - new Date(right.date).getTime();
    });
  }

  return [...groups.values()];
}
