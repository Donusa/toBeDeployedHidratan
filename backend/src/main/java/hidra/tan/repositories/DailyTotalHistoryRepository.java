package hidra.tan.repositories;

import hidra.tan.entities.DailyTotalHistory;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DailyTotalHistoryRepository extends JpaRepository<DailyTotalHistory, Long> {
}
