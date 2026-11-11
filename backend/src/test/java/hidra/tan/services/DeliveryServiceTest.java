package hidra.tan.services;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import hidra.tan.entities.AppClient;
import hidra.tan.enums.ClientTransactionType;

@ExtendWith(MockitoExtension.class)
class DeliveryServiceTest {

    @Mock
    private AppClientService appClientService;
    @Mock
    private ClientTransactionService clientTransactionService;
    @InjectMocks
    private DeliveryService deliveryService;

    private AppClient client;

    @BeforeEach
    void setUp() {
        client = AppClient.builder().id(1L).debt(new BigDecimal("100.00")).build();
        when(appClientService.findById(1L)).thenReturn(Optional.of(client));
    }

    @Test
    void visitWithoutPaymentOrNewDebtDoesNotCreateAMonetaryTransaction() {
        deliveryService.payDebt(1L, new BigDecimal("100.0"));

        verifyNoInteractions(clientTransactionService);
        verify(appClientService, never()).save(any());
    }

    @Test
    void reducingDebtRecordsAPositivePayment() {
        BigDecimal after = new BigDecimal("40.00");
        deliveryService.payDebt(1L, after);

        assertEquals(after, client.getDebt());
        verify(appClientService).save(client);
        verify(clientTransactionService).recordMonetary(client, new BigDecimal("60.00"),
                new BigDecimal("100.00"), after, ClientTransactionType.MONETARY_PAYMENT);
    }

    @Test
    void increasingDebtRecordsDebtWithAPositiveAmount() {
        BigDecimal after = new BigDecimal("160.00");
        deliveryService.payDebt(1L, after);

        assertEquals(after, client.getDebt());
        verify(appClientService).save(client);
        verify(clientTransactionService).recordMonetary(client, new BigDecimal("60.00"),
                new BigDecimal("100.00"), after, ClientTransactionType.MONETARY_DEBT_UPDATE);
    }

    @Test
    void firstDebtStartsFromZeroWhenThePreviousBalanceIsNull() {
        client.setDebt(null);
        BigDecimal after = new BigDecimal("25.00");

        deliveryService.payDebt(1L, after);

        verify(clientTransactionService).recordMonetary(client, after,
                BigDecimal.ZERO, after, ClientTransactionType.MONETARY_DEBT_UPDATE);
    }
}
