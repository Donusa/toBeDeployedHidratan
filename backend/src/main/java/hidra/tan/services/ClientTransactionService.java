package hidra.tan.services;

import java.math.BigDecimal;
import java.util.Date;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import hidra.tan.entities.AppClient;
import hidra.tan.entities.ClientTransaction;
import hidra.tan.entities.Product;
import hidra.tan.enums.ClientTransactionType;
import hidra.tan.repositories.ClientTransactionRepository;

@Service
public class ClientTransactionService {

    @Autowired
    private ClientTransactionRepository repository;

    public ClientTransaction recordMonetary(AppClient client, BigDecimal amount, BigDecimal debtBefore, BigDecimal debtAfter, ClientTransactionType type) {
        ClientTransaction tx = ClientTransaction.builder()
                .client(client)
                .date(new Date())
                .type(type)
                .amount(amount)
                .debtBefore(debtBefore)
                .debtAfter(debtAfter)
                .build();
        return repository.save(tx);
    }

    public ClientTransaction recordProduct(AppClient client, Product product, int quantity, BigDecimal debt, ClientTransactionType type) {
        ClientTransaction tx = ClientTransaction.builder()
                .client(client)
                .date(new Date())
                .type(type)
                .product(product)
                .quantity(quantity)
                .debtBefore(debt)
                .debtAfter(debt)
                .build();
        return repository.save(tx);
    }

    public List<ClientTransaction> getByClientId(Long clientId) {
        return repository.findByClientIdOrderByDateDesc(clientId);
    }
}
