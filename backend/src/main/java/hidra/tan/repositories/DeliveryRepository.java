package hidra.tan.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import hidra.tan.entities.Delivery;

@Repository
public interface DeliveryRepository extends JpaRepository<Delivery, Long> {
	
}