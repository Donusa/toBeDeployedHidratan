package hidra.tan.services;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import hidra.tan.entities.AppUser;
import hidra.tan.repositories.UserRepository;

@Service
public class AppUserService {

	@Autowired
	private UserRepository userRepository;

	public List<AppUser> findAll() {
		return userRepository.findAll();
	}

	public AppUser findByEmail(String email) {
		Optional<AppUser> user = userRepository.findAll().stream().filter(u -> u.getEmail().equals(email)).findFirst();
		return user.orElseThrow(() -> new RuntimeException("User not found with email: " + email));

	}

	public AppUser findById(Long id) {
		return userRepository.findById(id).orElseThrow(() -> new RuntimeException("User not found with id: " + id));
	}

	public AppUser save(AppUser appUser) {
		return userRepository.save(appUser);
	}

	public AppUser update(String email, AppUser appUser) {
		AppUser existingUser = userRepository.findByEmail(email)
				.orElseThrow(() -> new RuntimeException("User not found with email: " + email));
		existingUser.setEmail(appUser.getEmail());
		existingUser.setRole(appUser.getRole());
		existingUser.setActive(appUser.getActive());
		existingUser.setName(appUser.getName());
		if(appUser.getDeliveries() != null) {			
			existingUser.getDeliveries().clear();
			existingUser.getDeliveries().addAll(appUser.getDeliveries());
		}
		existingUser.setPass(appUser.getPass());

		return userRepository.save(existingUser);
	}

	public void deleteById(Long id) {
		userRepository.deleteById(id);
	}

	public AppUser disable(String id) {
		AppUser existingUserOpt = findByEmail(id);
		if (existingUserOpt != null) {
			AppUser existingUser = existingUserOpt;
			existingUser.setActive(false);
			return userRepository.save(existingUser);
		}
		return null;
	}
}
