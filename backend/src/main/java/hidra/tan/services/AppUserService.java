package hidra.tan.services;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import hidra.tan.entities.AppUser;
import hidra.tan.entities.DeliveryManStock;
import hidra.tan.entities.Product;
import hidra.tan.repositories.ProductRepository;
import hidra.tan.repositories.UserRepository;

@Service
public class AppUserService {

	@Autowired
	private UserRepository userRepository;
	@Autowired
	private ProductRepository productRepository;
	
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


	public AppUser updateUserDetailsByEmail(String email, AppUser updatedUser) {
		AppUser existingUser = userRepository.findByEmail(email)
				.orElseThrow(() -> new RuntimeException("User not found with email: " + email));
		existingUser.setEmail(updatedUser.getEmail());
		existingUser.setRole(updatedUser.getRole());
		existingUser.setActive(updatedUser.getActive());
		existingUser.setName(updatedUser.getName());
		if (updatedUser.getDeliveryManStock() != null) {
			existingUser.getDeliveryManStock().clear();
			existingUser.getDeliveryManStock().addAll(updatedUser.getDeliveryManStock());
		}

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

	public boolean addStockToDeliveryMan(Long productId, int quantity, String delivererEmail) {
		Product product = productRepository.findById(productId)
				.orElseThrow(() -> new IllegalArgumentException("Product not found"));

		AppUser deliverer = userRepository.findByEmail(delivererEmail)
				.orElseThrow(() -> new RuntimeException("User not found with email: " + delivererEmail));

		Optional<DeliveryManStock> existingStock = deliverer.getDeliveryManStock().stream()
				.filter(stock -> stock.getProduct().getId().equals(productId))
				.findFirst();

		if (existingStock.isPresent()) {

			existingStock.get().setQuantity(existingStock.get().getQuantity() + quantity);
		} else {

			DeliveryManStock stock = new DeliveryManStock();
			stock.setDeliveryMan(deliverer);
			stock.setProduct(product);
			stock.setQuantity(quantity);
			deliverer.getDeliveryManStock().add(stock);
		}

		userRepository.save(deliverer);

		return true;
	}

	public AppUser enable(String email) {
		AppUser existingUserOpt = findByEmail(email);
		if (existingUserOpt != null) {
			AppUser existingUser = existingUserOpt;
			existingUser.setActive(true);
			return userRepository.save(existingUser);
		}
		return null;
	}


}


