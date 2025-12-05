package hidra.tan.repositories;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import hidra.tan.entities.ClientTransaction;

@Repository
public interface ClientTransactionRepository extends JpaRepository<ClientTransaction, Long> {
    List<ClientTransaction> findByClientIdOrderByDateDesc(Long clientId);
    void deleteByClientId(Long clientId);
}
