package hidra.tan.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import hidra.tan.entities.AppClient;

@Repository
public interface AppClientRepository extends JpaRepository<AppClient, Long>{
}
