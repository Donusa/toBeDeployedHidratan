package hidra.tan.services;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.NullSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import hidra.tan.entities.AppClient;
import hidra.tan.entities.AppUser;
import hidra.tan.entities.ClientStock;
import hidra.tan.entities.ClientTransaction;
import hidra.tan.entities.Delivery;
import hidra.tan.entities.DeliveryManStock;
import hidra.tan.entities.Product;
import hidra.tan.enums.ClientTransactionType;
import hidra.tan.repositories.AppClientRepository;
import hidra.tan.repositories.ClientStockRepository;
import hidra.tan.repositories.ClientTransactionRepository;
import hidra.tan.repositories.DeliveryManStockRepository;
import hidra.tan.repositories.DeliveryRepository;
import hidra.tan.requests.VisitCompletionRequest;
import hidra.tan.requests.VisitCompletionRequest.ProductMovement;
import jakarta.persistence.EntityManager;

@ExtendWith(MockitoExtension.class)
class VisitCompletionServiceTest {

    @Mock private DeliveryRepository deliveryRepository;
    @Mock private AppClientRepository appClientRepository;
    @Mock private AppClientService appClientService;
    @Mock private AppUserService appUserService;
    @Mock private ClientStockRepository clientStockRepository;
    @Mock private DeliveryManStockRepository deliveryManStockRepository;
    @Mock private ClientTransactionRepository transactionRepository;
    @Mock private EntityManager entityManager;

    private DeliveryService service;
    private AppClient client;
    private AppUser deliverer;
    private Delivery delivery;
    private Product product;
    private ClientStock clientStock;
    private DeliveryManStock delivererStock;

    @BeforeEach
    void setUp() {
        ClientTransactionService transactions = new ClientTransactionService();
        ReflectionTestUtils.setField(transactions, "repository", transactionRepository);
        service = new DeliveryService();
        ReflectionTestUtils.setField(service, "deliveryRepository", deliveryRepository);
        ReflectionTestUtils.setField(service, "appClientRepository", appClientRepository);
        ReflectionTestUtils.setField(service, "appClientService", appClientService);
        ReflectionTestUtils.setField(service, "appUserService", appUserService);
        ReflectionTestUtils.setField(service, "clientStockRepository", clientStockRepository);
        ReflectionTestUtils.setField(service, "deliveryManStockRepository", deliveryManStockRepository);
        ReflectionTestUtils.setField(service, "clientTransactionService", transactions);
        ReflectionTestUtils.setField(service, "entityManager", entityManager);

        client = AppClient.builder().id(1L).debt(new BigDecimal("100.00"))
                .frecuency(7).clientStock(new ArrayList<>()).build();
        deliverer = AppUser.builder().id(2).email("delivery@example.com")
                .deliveryManStock(new ArrayList<>()).emptyProducts(new ArrayList<>()).build();
        product = Product.builder().id(3L).name("Bidon").price(new BigDecimal("25.00"))
                .returnable(true).build();
        clientStock = ClientStock.builder().client(client).product(product).quantity(5).build();
        delivererStock = DeliveryManStock.builder().deliveryMan(deliverer).product(product).quantity(10).build();
        client.getClientStock().add(clientStock);
        deliverer.getDeliveryManStock().add(delivererStock);
        delivery = Delivery.builder().id(10L).client(client).deliveryMan(deliverer)
                .deliveryDate("04/11/2026T10:30").status("PENDING").uniqueVisit(false).build();
    }

    @Test
    void deliveryReturnAndPaymentShareOneHistoryEntryAndCreateOneNextVisit() {
        stubPendingVisit();
        stubStockLookups();
        VisitCompletionRequest request = request(2, 3, "30.00");

        assertSame(delivery, service.completeDelivery(10L, request));

        assertEquals("COMPLETED", delivery.getStatus());
        assertEquals(8, delivererStock.getQuantity());
        assertEquals(4, clientStock.getQuantity());
        assertEquals(1, deliverer.getEmptyProducts().size());
        assertEquals(3, deliverer.getEmptyProducts().get(0).getQuantity());
        assertEquals(new BigDecimal("120.00"), client.getDebt());
        List<ClientTransaction> transactions = savedTransactions(4);
        assertEquals(List.of(ClientTransactionType.PRODUCT_DELIVERY, ClientTransactionType.PRODUCT_RETURN,
                ClientTransactionType.MONETARY_DEBT_UPDATE, ClientTransactionType.MONETARY_PAYMENT),
                transactions.stream().map(ClientTransaction::getType).toList());
        assertEquals(2, transactions.get(0).getQuantity());
        assertEquals(3, transactions.get(1).getQuantity());
        assertEquals(new BigDecimal("50.00"), transactions.get(2).getAmount());
        assertEquals(new BigDecimal("30.00"), transactions.get(3).getAmount());
        assertOneHistoryGroup(transactions, 10L);
        assertOneNextVisit("11/11/2026T10:30");
    }

    @Test
    void fullyPaidProductsStillRecordBothChargeAndPaymentWhenBalanceIsUnchanged() {
        stubPendingVisit();
        stubStockLookups();

        service.completeDelivery(10L, request(2, 0, "50.00"));

        assertEquals(new BigDecimal("100.00"), client.getDebt());
        List<ClientTransaction> transactions = savedTransactions(3);
        ClientTransaction charge = transactions.get(1);
        ClientTransaction payment = transactions.get(2);
        assertEquals(ClientTransactionType.MONETARY_DEBT_UPDATE, charge.getType());
        assertEquals(new BigDecimal("50.00"), charge.getAmount());
        assertEquals(new BigDecimal("100.00"), charge.getDebtBefore());
        assertEquals(new BigDecimal("150.00"), charge.getDebtAfter());
        assertEquals(ClientTransactionType.MONETARY_PAYMENT, payment.getType());
        assertEquals(new BigDecimal("50.00"), payment.getAmount());
        assertEquals(new BigDecimal("150.00"), payment.getDebtBefore());
        assertEquals(new BigDecimal("100.00"), payment.getDebtAfter());
        assertOneHistoryGroup(transactions, 10L);
        assertOneNextVisit("11/11/2026T10:30");
    }

    @Test
    void retryOfCompletedSubmissionDoesNotRepeatStocksPaymentsHistoryOrRecurrence() {
        stubPendingVisit();
        stubStockLookups();
        VisitCompletionRequest request = request(2, 3, "30.00");

        service.completeDelivery(10L, request);
        service.completeDelivery(10L, request);

        assertEquals(8, delivererStock.getQuantity());
        assertEquals(4, clientStock.getQuantity());
        assertEquals(1, deliverer.getEmptyProducts().size());
        assertEquals(new BigDecimal("120.00"), client.getDebt());
        savedTransactions(4);
        verify(appClientService, times(1)).save(client);
        verify(appClientRepository, times(1)).findByIdForUpdate(1L);
        assertOneNextVisit("11/11/2026T10:30");
    }

    @Test
    void alreadyCompletedVisitReturnsBeforeProcessingAnyNewPayload() {
        delivery.setStatus("COMPLETED");
        when(deliveryRepository.findByIdForUpdate(10L)).thenReturn(Optional.of(delivery));

        assertSame(delivery, service.completeDelivery(10L, request(2, 3, "30.00")));

        verifyNoInteractions(appClientRepository, appClientService, appUserService,
                transactionRepository, clientStockRepository, deliveryManStockRepository, entityManager);
        verify(deliveryRepository, never()).save(any());
    }

    @Test
    void cancelledVisitRejectsCompletionWithoutSideEffects() {
        delivery.setStatus("CANCELLED");
        when(deliveryRepository.findByIdForUpdate(10L)).thenReturn(Optional.of(delivery));

        assertThrows(IllegalArgumentException.class,
                () -> service.completeDelivery(10L, request(2, 3, "30.00")));

        assertEquals("CANCELLED", delivery.getStatus());
        verifyNoInteractions(appClientRepository, appClientService, appUserService,
                transactionRepository, clientStockRepository, deliveryManStockRepository, entityManager);
        verify(deliveryRepository, never()).save(any());
    }

    @Test
    void legacyCompletionLeavesSchedulingToTheLegacyCaller() {
        when(deliveryRepository.findByIdForUpdate(10L)).thenReturn(Optional.of(delivery));

        service.completeDelivery(10L);

        assertEquals("COMPLETED", delivery.getStatus());
        verify(deliveryRepository, times(1)).save(delivery);
        verifyNoInteractions(appClientRepository, appClientService, appUserService,
                transactionRepository, clientStockRepository, deliveryManStockRepository, entityManager);
    }

    @Test
    void completedVisitCannotBeCancelledAndSubmittedAgain() {
        delivery.setStatus("COMPLETED");
        when(deliveryRepository.findByIdForUpdate(10L)).thenReturn(Optional.of(delivery));

        assertThrows(IllegalArgumentException.class, () -> service.cancelDelivery(10L));

        assertEquals("COMPLETED", delivery.getStatus());
        verify(deliveryRepository, never()).save(any());
    }

    @Test
    void completedVisitCannotBeReassignedOrEdited() {
        delivery.setStatus("COMPLETED");
        when(deliveryRepository.findByIdForUpdate(10L)).thenReturn(Optional.of(delivery));

        assertThrows(IllegalArgumentException.class,
                () -> service.updateDelivery(10L, 99L, "another@example.com", "05/11/2026T11:00"));

        assertSame(client, delivery.getClient());
        assertSame(deliverer, delivery.getDeliveryMan());
        assertEquals("04/11/2026T10:30", delivery.getDeliveryDate());
        verify(deliveryRepository, never()).save(any());
        verifyNoInteractions(appClientService, appUserService);
    }

    @Test
    void uniqueVisitCompletesWithoutSchedulingAnotherVisit() {
        delivery.setUniqueVisit(true);
        stubPendingVisit();

        service.completeDelivery(10L, new VisitCompletionRequest());

        assertEquals("COMPLETED", delivery.getStatus());
        verify(deliveryRepository, times(1)).save(delivery);
        verifyNoInteractions(transactionRepository);
    }

    @ParameterizedTest
    @NullSource
    @ValueSource(ints = {0, -1})
    void missingOrNonPositiveFrequencyDoesNotScheduleAnotherVisit(Integer frequency) {
        client.setFrecuency(frequency);
        stubPendingVisit();

        service.completeDelivery(10L, new VisitCompletionRequest());

        assertEquals("COMPLETED", delivery.getStatus());
        verify(deliveryRepository, times(1)).save(delivery);
        verifyNoInteractions(transactionRepository);
    }

    @ParameterizedTest
    @ValueSource(strings = {"05/11/2026T10:30", "06/11/2026T10:30"})
    void nextVisitThatFallsOnWeekendMovesToMonday(String currentDate) {
        delivery.setDeliveryDate(currentDate);
        client.setFrecuency(2);
        stubPendingVisit();

        service.completeDelivery(10L, new VisitCompletionRequest());

        assertOneNextVisit("09/11/2026T10:30");
    }

    @Test
    void offRouteVisitGroupsMovementsWithoutCreatingScheduledVisitsAndIgnoresRetry() {
        when(appClientRepository.findByIdForUpdate(1L)).thenReturn(Optional.of(client));
        when(transactionRepository.existsByClientIdAndOperationId(1L, "off-route-operation"))
                .thenReturn(false, true);
        stubStockLookups();
        VisitCompletionRequest request = request(2, 3, "30.00");
        request.setClientId(1L);
        request.setDeliveryManEmail(deliverer.getEmail());
        request.setOperationId("off-route-operation");

        service.registerOffRouteVisit(request);
        service.registerOffRouteVisit(request);

        assertEquals(new BigDecimal("120.00"), client.getDebt());
        assertEquals(8, delivererStock.getQuantity());
        assertEquals(4, clientStock.getQuantity());
        List<ClientTransaction> transactions = savedTransactions(4);
        assertOneHistoryGroup(transactions, null);
        assertEquals("off-route-operation", transactions.get(0).getOperationId());
        verifyNoInteractions(deliveryRepository);
        verify(appClientService, times(1)).save(client);
    }

    @ParameterizedTest
    @NullSource
    @ValueSource(ints = {0, -1})
    void invalidProductQuantityRejectsVisitBeforeMakingChanges(Integer quantity) {
        stubPendingVisit();
        VisitCompletionRequest request = new VisitCompletionRequest();
        ProductMovement movement = movement(3L, 1);
        movement.setQuantity(quantity);
        request.setDeliveries(List.of(movement));

        assertThrows(IllegalArgumentException.class, () -> service.completeDelivery(10L, request));

        assertUnchangedVisit();
    }

    @Test
    void insufficientDeliveryStockRejectsVisitWithoutRecordingTransactionsOrNextVisit() {
        stubPendingVisit();
        stubStockLookups();

        assertThrows(IllegalArgumentException.class,
                () -> service.completeDelivery(10L, request(11, 0, "0.00")));

        assertUnchangedVisit();
    }

    @Test
    void insufficientClientStockRejectsReturnWithoutRecordingTransactionsOrNextVisit() {
        stubPendingVisit();
        stubStockLookups();

        assertThrows(IllegalArgumentException.class,
                () -> service.completeDelivery(10L, request(0, 6, "0.00")));

        assertUnchangedVisit();
    }

    @Test
    void negativePaymentRejectsVisitBeforeTransferringProducts() {
        stubPendingVisit();

        assertThrows(IllegalArgumentException.class,
                () -> service.completeDelivery(10L, request(2, 3, "-1.00")));

        assertUnchangedVisit();
    }

    private void stubPendingVisit() {
        when(deliveryRepository.findByIdForUpdate(10L)).thenReturn(Optional.of(delivery));
        when(appClientRepository.findByIdForUpdate(1L)).thenReturn(Optional.of(client));
    }

    private void stubStockLookups() {
        when(appUserService.findByEmail(deliverer.getEmail())).thenReturn(deliverer);
        when(appClientService.findById(1L)).thenReturn(Optional.of(client));
    }

    private VisitCompletionRequest request(int delivered, int returned, String payment) {
        VisitCompletionRequest request = new VisitCompletionRequest();
        if (delivered > 0) request.setDeliveries(List.of(movement(3L, delivered)));
        if (returned > 0) request.setReturns(List.of(movement(3L, returned)));
        request.setPaymentAmount(new BigDecimal(payment));
        return request;
    }

    private ProductMovement movement(Long productId, int quantity) {
        ProductMovement movement = new ProductMovement();
        movement.setProductId(productId);
        movement.setQuantity(quantity);
        return movement;
    }

    private List<ClientTransaction> savedTransactions(int count) {
        ArgumentCaptor<ClientTransaction> saved = ArgumentCaptor.forClass(ClientTransaction.class);
        verify(transactionRepository, times(count)).save(saved.capture());
        return saved.getAllValues();
    }

    private void assertOneHistoryGroup(List<ClientTransaction> transactions, Long visitId) {
        ClientTransaction first = transactions.get(0);
        assertNotNull(first.getOperationId());
        assertFalse(first.getOperationId().isBlank());
        assertNotNull(first.getDate());
        for (ClientTransaction transaction : transactions) {
            assertEquals(first.getOperationId(), transaction.getOperationId());
            assertEquals(first.getDate(), transaction.getDate());
            assertEquals(visitId, transaction.getDeliveryId());
        }
    }

    private void assertOneNextVisit(String expectedDate) {
        ArgumentCaptor<Delivery> saved = ArgumentCaptor.forClass(Delivery.class);
        verify(deliveryRepository, times(2)).save(saved.capture());
        assertSame(delivery, saved.getAllValues().get(0));
        Delivery next = saved.getAllValues().get(1);
        assertNull(next.getId());
        assertSame(client, next.getClient());
        assertSame(deliverer, next.getDeliveryMan());
        assertEquals("PENDING", next.getStatus());
        assertEquals(expectedDate, next.getDeliveryDate());
        assertEquals(false, next.getUniqueVisit());
    }

    private void assertUnchangedVisit() {
        assertEquals("PENDING", delivery.getStatus());
        assertEquals(new BigDecimal("100.00"), client.getDebt());
        assertEquals(10, delivererStock.getQuantity());
        assertEquals(5, clientStock.getQuantity());
        assertEquals(0, deliverer.getEmptyProducts().size());
        verifyNoInteractions(transactionRepository, clientStockRepository, deliveryManStockRepository);
        verify(deliveryRepository, never()).save(any());
        verify(appClientService, never()).save(any());
    }
}

