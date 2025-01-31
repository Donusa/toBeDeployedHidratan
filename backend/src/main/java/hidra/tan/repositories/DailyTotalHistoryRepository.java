package hidra.tan.repositories;

import hidra.tan.entities.AppUser;
import hidra.tan.entities.DailyTotalHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DailyTotalHistoryRepository extends JpaRepository<DailyTotalHistory, Long> {

	DailyTotalHistory findByDeliveryMan(AppUser deliveryMan);
	
}
