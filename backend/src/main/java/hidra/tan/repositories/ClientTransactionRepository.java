package hidra.tan.repositories;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import hidra.tan.entities.ClientTransaction;

@Repository
public interface ClientTransactionRepository extends JpaRepository<ClientTransaction, Long> {
    @Query("""
            select t from ClientTransaction t
            where t.client.id = :clientId and coalesce(t.hiddenFromHistory, false) = false
            order by t.date desc
            """)
    List<ClientTransaction> findVisibleHistory(Long clientId);

    Optional<ClientTransaction> findByIdAndClientId(Long id, Long clientId);

    @Modifying
    @Query("""
            update ClientTransaction t set t.hiddenFromHistory = true
            where t.client.id = :clientId and (
                t.id = :transactionId
                or t.operationId = :operationId
                or (:operationId is null and t.deliveryId = :deliveryId
                    and (t.operationId is null or t.operationId = ''))
            )
            """)
    void hideHistoryEntry(Long clientId, Long transactionId, String operationId, Long deliveryId);

    boolean existsByClientIdAndOperationId(Long clientId, String operationId);
    void deleteByClientId(Long clientId);
}
