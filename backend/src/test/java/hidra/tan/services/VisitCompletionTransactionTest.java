package hidra.tan.services;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;

import hidra.tan.entities.AppClient;
import hidra.tan.entities.AppUser;
import hidra.tan.entities.ClientStock;
import hidra.tan.entities.Delivery;
import hidra.tan.entities.DeliveryManStock;
import hidra.tan.entities.Product;
import hidra.tan.enums.Roles;
import hidra.tan.logging.Log4jImpl;
import hidra.tan.requests.VisitCompletionRequest;
import hidra.tan.requests.VisitCompletionRequest.ProductMovement;
import hidra.tan.utils.MailUtils;
import jakarta.persistence.EntityManager;

@DataJpaTest(showSql = false, properties = {
        "spring.datasource.url=jdbc:h2:mem:visit-completion;MODE=MySQL;DB_CLOSE_DELAY=-1;LOCK_TIMEOUT=10000",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "spring.jpa.show-sql=false"
})
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Import({DeliveryService.class, AppClientService.class, AppUserService.class, ClientTransactionService.class})
@Transactional(propagation = Propagation.NOT_SUPPORTED)
class VisitCompletionTransactionTest {

    @Autowired private DeliveryService service;
    @Autowired private EntityManager entityManager;
    @Autowired private PlatformTransactionManager transactionManager;
    @MockBean private MailUtils mailUtils;
    @MockBean private Log4jImpl logger;

    @Test
    void returnFailureRollsBackAnEarlierDeliveryStockUpdateAndHistoryRecord() {
        Fixture fixture = createFixture();

        assertThrows(IllegalArgumentException.class,
                () -> service.completeDelivery(fixture.deliveryId(), request(fixture, 2, 8, "30.00")));

        Snapshot actual = snapshot(fixture);
        assertEquals("PENDING", actual.status());
        assertEquals(new BigDecimal("100.00"), actual.debt());
        assertEquals(10, actual.delivererQuantity());
        assertEquals(5, actual.clientQuantity());
        assertEquals(0, actual.returnedQuantity());
        assertEquals(0L, actual.transactionCount());
        assertEquals(0L, actual.nextVisitCount());
    }

    @Test
    void committedCompletionCanBeRetriedWithoutRepeatingMovementsOrRecurrence() {
        Fixture fixture = createFixture();
        VisitCompletionRequest request = request(fixture, 2, 3, "30.00");

        service.completeDelivery(fixture.deliveryId(), request);
        service.completeDelivery(fixture.deliveryId(), request);

        assertCompletedOnce(snapshot(fixture));
    }

    @Test
    void simultaneousCompletionsSerializeAndCommitOnlyOneVisit() throws Exception {
        Fixture fixture = createFixture();
        ExecutorService executor = Executors.newFixedThreadPool(2);
        CountDownLatch ready = new CountDownLatch(2);
        CountDownLatch start = new CountDownLatch(1);
        try {
            Future<?> first = executor.submit(() -> completeAfterStart(fixture, ready, start));
            Future<?> second = executor.submit(() -> completeAfterStart(fixture, ready, start));
            if (!ready.await(5, TimeUnit.SECONDS)) {
                throw new AssertionError("Both completion requests must reach the start barrier");
            }
            start.countDown();
            first.get(20, TimeUnit.SECONDS);
            second.get(20, TimeUnit.SECONDS);
        } finally {
            start.countDown();
            executor.shutdownNow();
        }

        assertCompletedOnce(snapshot(fixture));
    }

    @Test
    void simultaneousDifferentVisitsPreserveTheSameDeliverersCombinedStockChanges() throws Exception {
        Fixture firstFixture = createFixture();
        Fixture secondFixture = createFixtureForSameDeliverer(firstFixture);
        ExecutorService executor = Executors.newFixedThreadPool(2);
        CountDownLatch ready = new CountDownLatch(2);
        CountDownLatch start = new CountDownLatch(1);
        try {
            Future<?> first = executor.submit(() -> completeAfterStart(firstFixture, ready, start));
            Future<?> second = executor.submit(() -> completeAfterStart(secondFixture, ready, start));
            if (!ready.await(5, TimeUnit.SECONDS)) {
                throw new AssertionError("Both completion requests must reach the start barrier");
            }
            start.countDown();
            first.get(20, TimeUnit.SECONDS);
            second.get(20, TimeUnit.SECONDS);
        } finally {
            start.countDown();
            executor.shutdownNow();
        }

        for (Fixture fixture : List.of(firstFixture, secondFixture)) {
            Snapshot actual = snapshot(fixture);
            assertEquals("COMPLETED", actual.status());
            assertEquals(new BigDecimal("120.00"), actual.debt());
            assertEquals(6, actual.delivererQuantity());
            assertEquals(4, actual.clientQuantity());
            assertEquals(6, actual.returnedQuantity());
            assertEquals(4L, actual.transactionCount());
            assertEquals(1L, actual.nextVisitCount());
        }
    }

    private void completeAfterStart(Fixture fixture, CountDownLatch ready, CountDownLatch start) {
        ready.countDown();
        try {
            if (!start.await(5, TimeUnit.SECONDS)) {
                throw new AssertionError("Concurrent completion start barrier timed out");
            }
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new AssertionError(exception);
        }
        service.completeDelivery(fixture.deliveryId(), request(fixture, 2, 3, "30.00"));
    }

    private Fixture createFixture() {
        return new TransactionTemplate(transactionManager).execute(status -> {
            Product product = Product.builder().name("Bidon").price(new BigDecimal("25.00"))
                    .returnable(true).build();
            entityManager.persist(product);
            AppClient client = AppClient.builder().address("Test address").debt(new BigDecimal("100.00"))
                    .frecuency(7).clientStock(new ArrayList<>()).build();
            entityManager.persist(client);
            AppUser deliverer = AppUser.builder().email(UUID.randomUUID() + "@example.com")
                    .name("Test deliverer").pass("unused").role(Roles.ROLE_DELIVERY)
                    .deliveryManStock(new ArrayList<>()).emptyProducts(new ArrayList<>())
                    .deliveries(new ArrayList<>()).build();
            entityManager.persist(deliverer);
            ClientStock clientStock = ClientStock.builder().client(client).product(product).quantity(5).build();
            client.getClientStock().add(clientStock);
            entityManager.persist(clientStock);
            DeliveryManStock delivererStock = DeliveryManStock.builder().deliveryMan(deliverer)
                    .product(product).quantity(10).build();
            deliverer.getDeliveryManStock().add(delivererStock);
            entityManager.persist(delivererStock);
            Delivery delivery = Delivery.builder().client(client).deliveryMan(deliverer)
                    .deliveryDate("04/11/2026T10:30").status("PENDING").uniqueVisit(false).build();
            deliverer.getDeliveries().add(delivery);
            entityManager.persist(delivery);
            entityManager.flush();
            return new Fixture(client.getId(), deliverer.getId(), product.getId(), delivery.getId());
        });
    }

    private Snapshot snapshot(Fixture fixture) {
        return new TransactionTemplate(transactionManager).execute(status -> {
            Delivery delivery = entityManager.find(Delivery.class, fixture.deliveryId());
            AppClient client = entityManager.find(AppClient.class, fixture.clientId());
            AppUser deliverer = entityManager.find(AppUser.class, fixture.delivererId());
            long transactions = entityManager.createQuery(
                    "select count(t) from ClientTransaction t where t.client.id = :clientId", Long.class)
                    .setParameter("clientId", fixture.clientId()).getSingleResult();
            long nextVisits = entityManager.createQuery(
                    "select count(d) from Delivery d where d.client.id = :clientId and d.id <> :deliveryId", Long.class)
                    .setParameter("clientId", fixture.clientId())
                    .setParameter("deliveryId", fixture.deliveryId()).getSingleResult();
            return new Snapshot(delivery.getStatus(), client.getDebt(),
                    deliverer.getDeliveryManStock().get(0).getQuantity(),
                    client.getClientStock().get(0).getQuantity(),
                    deliverer.getEmptyProducts().stream().mapToInt(item -> item.getQuantity()).sum(),
                    transactions, nextVisits);
        });
    }

    private Fixture createFixtureForSameDeliverer(Fixture previous) {
        return new TransactionTemplate(transactionManager).execute(status -> {
            Product product = entityManager.find(Product.class, previous.productId());
            AppUser deliverer = entityManager.find(AppUser.class, previous.delivererId());
            AppClient client = AppClient.builder().address("Another address").debt(new BigDecimal("100.00"))
                    .frecuency(7).clientStock(new ArrayList<>()).build();
            entityManager.persist(client);
            ClientStock clientStock = ClientStock.builder().client(client).product(product).quantity(5).build();
            client.getClientStock().add(clientStock);
            entityManager.persist(clientStock);
            Delivery delivery = Delivery.builder().client(client).deliveryMan(deliverer)
                    .deliveryDate("04/11/2026T11:00").status("PENDING").uniqueVisit(false).build();
            deliverer.getDeliveries().add(delivery);
            entityManager.persist(delivery);
            entityManager.flush();
            return new Fixture(client.getId(), deliverer.getId(), product.getId(), delivery.getId());
        });
    }

    private void assertCompletedOnce(Snapshot actual) {
        assertEquals("COMPLETED", actual.status());
        assertEquals(new BigDecimal("120.00"), actual.debt());
        assertEquals(8, actual.delivererQuantity());
        assertEquals(4, actual.clientQuantity());
        assertEquals(3, actual.returnedQuantity());
        assertEquals(4L, actual.transactionCount());
        assertEquals(1L, actual.nextVisitCount());
    }

    private VisitCompletionRequest request(Fixture fixture, int delivered, int returned, String payment) {
        VisitCompletionRequest request = new VisitCompletionRequest();
        ProductMovement delivery = new ProductMovement();
        delivery.setProductId(fixture.productId());
        delivery.setQuantity(delivered);
        request.setDeliveries(List.of(delivery));
        ProductMovement productReturn = new ProductMovement();
        productReturn.setProductId(fixture.productId());
        productReturn.setQuantity(returned);
        request.setReturns(List.of(productReturn));
        request.setPaymentAmount(new BigDecimal(payment));
        return request;
    }

    private record Fixture(Long clientId, Integer delivererId, Long productId, Long deliveryId) {}
    private record Snapshot(String status, BigDecimal debt, int delivererQuantity, int clientQuantity,
                            int returnedQuantity, long transactionCount, long nextVisitCount) {}
}
