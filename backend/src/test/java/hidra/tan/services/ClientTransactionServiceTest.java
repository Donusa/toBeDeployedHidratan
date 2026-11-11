package hidra.tan.services;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import hidra.tan.entities.AppClient;
import hidra.tan.entities.ClientTransaction;
import hidra.tan.enums.ClientTransactionType;
import hidra.tan.repositories.ClientTransactionRepository;

@ExtendWith(MockitoExtension.class)
class ClientTransactionServiceTest {

    @Mock
    private ClientTransactionRepository repository;
    @InjectMocks
    private ClientTransactionService service;

    private final AppClient client = AppClient.builder().id(1L).build();

    @Test
    void directZeroPaymentIsNotSaved() {
        assertNull(service.recordMonetary(client, new BigDecimal("0.00"),
                BigDecimal.TEN, BigDecimal.TEN, ClientTransactionType.MONETARY_PAYMENT));
        verifyNoInteractions(repository);
    }

    @Test
    void negativePaymentIsSavedAsPositiveDebt() {
        when(repository.save(any(ClientTransaction.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ClientTransaction result = service.recordMonetary(client, new BigDecimal("-50.00"),
                BigDecimal.TEN, new BigDecimal("60.00"), ClientTransactionType.MONETARY_PAYMENT);

        assertEquals(ClientTransactionType.MONETARY_DEBT_UPDATE, result.getType());
        assertEquals(new BigDecimal("50.00"), result.getAmount());
        assertEquals(BigDecimal.TEN, result.getDebtBefore());
        assertEquals(new BigDecimal("60.00"), result.getDebtAfter());
    }

    @Test
    void positivePaymentKeepsItsTypeAndAmount() {
        when(repository.save(any(ClientTransaction.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ClientTransaction result = service.recordMonetary(client, new BigDecimal("25.00"),
                new BigDecimal("60.00"), new BigDecimal("35.00"), ClientTransactionType.MONETARY_PAYMENT);

        assertEquals(ClientTransactionType.MONETARY_PAYMENT, result.getType());
        assertEquals(new BigDecimal("25.00"), result.getAmount());
    }

    @Test
    void missingAmountIsCalculatedFromTheBalanceChange() {
        when(repository.save(any(ClientTransaction.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ClientTransaction result = service.recordMonetary(client, null,
                BigDecimal.TEN, new BigDecimal("30"), ClientTransactionType.MONETARY_DEBT_UPDATE);

        assertEquals(ClientTransactionType.MONETARY_DEBT_UPDATE, result.getType());
        assertEquals(new BigDecimal("20"), result.getAmount());
    }

    @Test
    void zeroPaymentWithAnIncreasedBalanceStillRecordsTheNewDebt() {
        when(repository.save(any(ClientTransaction.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ClientTransaction result = service.recordMonetary(client, BigDecimal.ZERO,
                new BigDecimal("100.00"), new BigDecimal("160.00"), ClientTransactionType.MONETARY_PAYMENT);

        assertEquals(ClientTransactionType.MONETARY_DEBT_UPDATE, result.getType());
        assertEquals(new BigDecimal("60.00"), result.getAmount());
    }
}
