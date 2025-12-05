package hidra.tan.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import hidra.tan.entities.Delivery;

@Repository
public interface DeliveryRepository extends JpaRepository<Delivery, Long> {

    @Modifying
    @Transactional
    @Query("delete from Delivery d where d.client.id = :clientId")
    void deleteByClientId(@Param("clientId") Long clientId);
}
