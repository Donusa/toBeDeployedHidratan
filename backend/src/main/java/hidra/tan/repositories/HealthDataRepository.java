package hidra.tan.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import hidra.tan.entities.HealthData;

@Repository
public interface HealthDataRepository extends JpaRepository<HealthData, Long> {
}
