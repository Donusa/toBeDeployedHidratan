package hidra.tan.services;

import java.math.BigDecimal;
import java.util.Date;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import hidra.tan.entities.AppClient;
import hidra.tan.entities.ClientTransaction;
import hidra.tan.entities.Product;
import hidra.tan.enums.ClientTransactionType;
import hidra.tan.repositories.ClientTransactionRepository;

@Service
public class ClientTransactionService {

    public record VisitContext(String operationId, Long deliveryId, Date date) {}

    @Autowired
    private ClientTransactionRepository repository;

    public ClientTransaction recordMonetary(AppClient client, BigDecimal amount, BigDecimal debtBefore, BigDecimal debtAfter, ClientTransactionType type) {
        return recordMonetary(client, amount, debtBefore, debtAfter, type, null);
    }

    public ClientTransaction recordMonetary(AppClient client, BigDecimal amount, BigDecimal debtBefore, BigDecimal debtAfter, ClientTransactionType type, VisitContext visit) {
        BigDecimal movementAmount = amount;
        if (movementAmount == null || movementAmount.signum() == 0) {
            BigDecimal before = debtBefore == null ? BigDecimal.ZERO : debtBefore;
            BigDecimal after = debtAfter == null ? before : debtAfter;
            movementAmount = before.subtract(after);
        }
        if (movementAmount.signum() == 0) {
            return null;
        }
        ClientTransactionType movementType = type;
        if (type == ClientTransactionType.MONETARY_PAYMENT && movementAmount.signum() < 0) {
            movementType = ClientTransactionType.MONETARY_DEBT_UPDATE;
        }

        ClientTransaction tx = ClientTransaction.builder()
                .client(client)
                .date(visit == null ? new Date() : visit.date())
                .operationId(visit == null ? null : visit.operationId())
                .deliveryId(visit == null ? null : visit.deliveryId())
                .type(movementType)
                .amount(movementAmount.abs())
                .debtBefore(debtBefore)
                .debtAfter(debtAfter)
                .build();
        return repository.save(tx);
    }

    public ClientTransaction recordProduct(AppClient client, Product product, int quantity, BigDecimal debt, ClientTransactionType type) {
        return recordProduct(client, product, quantity, debt, type, null);
    }

    public ClientTransaction recordProduct(AppClient client, Product product, int quantity, BigDecimal debt, ClientTransactionType type, VisitContext visit) {
        ClientTransaction tx = ClientTransaction.builder()
                .client(client)
                .date(visit == null ? new Date() : visit.date())
                .operationId(visit == null ? null : visit.operationId())
                .deliveryId(visit == null ? null : visit.deliveryId())
                .type(type)
                .product(product)
                .quantity(quantity)
                .debtBefore(debt)
                .debtAfter(debt)
                .build();
        return repository.save(tx);
    }

    public List<ClientTransaction> getByClientId(Long clientId) {
        return repository.findVisibleHistory(clientId);
    }

    @Transactional
    public boolean hideHistoryEntry(Long clientId, Long transactionId) {
        ClientTransaction transaction = repository.findByIdAndClientId(transactionId, clientId).orElse(null);
        if (transaction == null) {
            return false;
        }

        String operationId = transaction.getOperationId();
        if (operationId != null && operationId.isEmpty()) {
            operationId = null;
        }
        // Keep the rows so an off-route visit retry is still recognized after hiding its history.
        repository.hideHistoryEntry(clientId, transactionId, operationId, transaction.getDeliveryId());
        return true;
    }

    public boolean hasVisitOperation(Long clientId, String operationId) {
        return repository.existsByClientIdAndOperationId(clientId, operationId);
    }

    public void deleteByClientId(Long clientId) {
        repository.deleteByClientId(clientId);
    }
}
