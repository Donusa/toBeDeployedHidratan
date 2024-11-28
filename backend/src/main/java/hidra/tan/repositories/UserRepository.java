package hidra.tan.repositories;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import hidra.tan.entities.AppUser;


@Repository
public interface UserRepository extends JpaRepository<AppUser, Long>{

	Optional<AppUser> findByEmail(String email);
	Optional<AppUser> findByResetToken(String resetToken);
}
