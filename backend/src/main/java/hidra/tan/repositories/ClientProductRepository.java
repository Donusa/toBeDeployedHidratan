package hidra.tan.repositories;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import hidra.tan.entities.ClientProduct;

@Repository
public interface ClientProductRepository extends JpaRepository<ClientProduct, Long>{

	Optional<ClientProduct> findByClientIdAndProductId(Long clientId, Long productId);

}
