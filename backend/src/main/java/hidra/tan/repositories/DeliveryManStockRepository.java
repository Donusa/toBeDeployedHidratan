package hidra.tan.repositories;

import hidra.tan.entities.AppUser;
import hidra.tan.entities.DeliveryManStock;
import hidra.tan.entities.Product;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DeliveryManStockRepository extends JpaRepository<DeliveryManStock, Long> {
    DeliveryManStock findByDeliveryManAndProduct(AppUser deliveryMan, Product product);

}
