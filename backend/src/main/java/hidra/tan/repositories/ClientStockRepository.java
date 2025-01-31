package hidra.tan.repositories;

import hidra.tan.entities.AppClient;
import hidra.tan.entities.ClientStock;
import hidra.tan.entities.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ClientStockRepository extends JpaRepository<ClientStock, Long> {
    
	ClientStock findByClientAndProduct(AppClient client, Product product);

}
