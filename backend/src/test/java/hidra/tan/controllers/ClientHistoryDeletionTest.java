package hidra.tan.controllers;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.math.BigDecimal;
import java.util.Date;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

import hidra.tan.entities.AppClient;
import hidra.tan.entities.AppUser;
import hidra.tan.entities.ClientTransaction;
import hidra.tan.enums.ClientTransactionType;
import hidra.tan.enums.Roles;
import hidra.tan.repositories.AppClientRepository;
import hidra.tan.repositories.ClientTransactionRepository;
import hidra.tan.repositories.UserRepository;
import hidra.tan.requests.VisitCompletionRequest;
import hidra.tan.services.ClientTransactionService;
import hidra.tan.services.DeliveryService;

@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:history-deletion;MODE=MySQL;DB_CLOSE_DELAY=-1",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "spring.jpa.show-sql=false",
        "SECRET_KEY=test"
})
@AutoConfigureMockMvc
class ClientHistoryDeletionTest {

    private static final String HISTORY = "/delivery/clients/{clientId}/transactions";

    @Autowired private MockMvc mvc;
    @Autowired private AppClientRepository clients;
    @Autowired private UserRepository users;
    @Autowired private ClientTransactionRepository transactions;
    @Autowired private ClientTransactionService history;
    @Autowired private DeliveryService deliveries;

    @Test
    void onlyAnAdminCanHideHistoryAndAnOffRouteRetryKeepsTheOriginalDebt() throws Exception {
        AppClient client = createClient();
        AppClient otherClient = createClient();
        AppUser employee = users.save(AppUser.builder().email("employee@example.com")
                .role(Roles.ROLE_DELIVERY).build());
        VisitCompletionRequest request = new VisitCompletionRequest();
        request.setClientId(client.getId());
        request.setDeliveryManEmail(employee.getEmail());
        request.setOperationId("off-route-payment");
        request.setPaymentAmount(new BigDecimal("25.00"));
        deliveries.registerOffRouteVisit(request);
        Long transactionId = history.getByClientId(client.getId()).get(0).getId();

        mvc.perform(delete(HISTORY + "/{transactionId}", client.getId(), transactionId)
                .with(user("employee").roles("DELIVERY"))).andExpect(status().isForbidden());
        mvc.perform(delete(HISTORY + "/{transactionId}", otherClient.getId(), transactionId)
                .with(user("admin").roles("ADMIN"))).andExpect(status().isNotFound());
        mvc.perform(get(HISTORY, client.getId()).with(user("employee").roles("DELIVERY")))
                .andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(1));

        deleteHistoryEntry(client, transactionId);
        deleteHistoryEntry(client, transactionId);
        deliveries.registerOffRouteVisit(request);

        mvc.perform(get(HISTORY, client.getId()).with(user("employee").roles("DELIVERY")))
                .andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(0));
        assertEquals(new BigDecimal("75.00"), clients.findById(client.getId()).orElseThrow().getDebt());
    }

    @Test
    void deletingOneEntryRespectsVisitGroupingAndClientScope() throws Exception {
        AppClient client = createClient();
        AppClient otherClient = createClient();
        ClientTransaction first = record(client, "visit", 99L);
        record(client, "visit", 99L);
        ClientTransaction legacy = record(client, null, 99L);
        record(client, "", 99L);
        ClientTransaction anotherVisit = record(client, "different-visit", 99L);
        ClientTransaction standalone = record(client, null, null);
        ClientTransaction anotherClientVisit = record(otherClient, "visit", 99L);

        deleteHistoryEntry(client, first.getId());
        assertEquals(4, history.getByClientId(client.getId()).size());
        deleteHistoryEntry(client, legacy.getId());
        deleteHistoryEntry(client, standalone.getId());

        assertEquals(List.of(anotherVisit.getId()), history.getByClientId(client.getId()).stream()
                .map(ClientTransaction::getId).toList());
        assertEquals(List.of(anotherClientVisit.getId()), history.getByClientId(otherClient.getId()).stream()
                .map(ClientTransaction::getId).toList());
    }

    private AppClient createClient() {
        return clients.save(AppClient.builder().debt(new BigDecimal("100.00")).build());
    }

    private ClientTransaction record(AppClient client, String operationId, Long deliveryId) {
        return transactions.save(ClientTransaction.builder().client(client).date(new Date())
                .type(ClientTransactionType.PRODUCT_DELIVERY).operationId(operationId).deliveryId(deliveryId).build());
    }

    private void deleteHistoryEntry(AppClient client, Long transactionId) throws Exception {
        mvc.perform(delete(HISTORY + "/{transactionId}", client.getId(), transactionId)
                .with(user("admin").roles("ADMIN"))).andExpect(status().isNoContent());
    }
}
