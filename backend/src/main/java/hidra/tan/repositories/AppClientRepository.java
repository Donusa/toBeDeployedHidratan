package hidra.tan.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import jakarta.persistence.LockModeType;
import java.util.Optional;

import hidra.tan.entities.AppClient;

@Repository
public interface AppClientRepository extends JpaRepository<AppClient, Long>{
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select c from AppClient c where c.id = :id")
    Optional<AppClient> findByIdForUpdate(@Param("id") Long id);
}
