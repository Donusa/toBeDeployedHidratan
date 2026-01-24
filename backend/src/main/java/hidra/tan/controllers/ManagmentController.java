
package hidra.tan.controllers;

import java.math.BigDecimal;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import hidra.tan.entities.AppClient;
import hidra.tan.entities.AppUser;
import hidra.tan.entities.ClientStock;
import hidra.tan.entities.DeliveryManStock;
import hidra.tan.entities.Product;
import hidra.tan.responses.AppUserResponse;
import hidra.tan.services.AppClientService;
import hidra.tan.services.AppUserService;
import hidra.tan.services.DeliveryService;
import hidra.tan.services.ClientTransactionService;
import hidra.tan.services.ProductService;
import hidra.tan.enums.ClientTransactionType;
import hidra.tan.repositories.ClientStockRepository;

import java.util.Map;

import hidra.tan.entities.HealthData;
import hidra.tan.services.HealthDataService;

/**
 * Controller for managing application users.
 */
@RestController
@PreAuthorize("hasRole('ROLE_ADMIN')")
@RequestMapping("/api/v1/management")
public class ManagmentController {

    @Autowired
    private AppUserService appUserService;

    @Autowired
    private AppClientService appClientService;

    @Autowired
    private DeliveryService deliveryService;
    @Autowired
    private ClientStockRepository clientStockRepository;
    @Autowired
    private ProductService productService;
    @Autowired
    private ClientTransactionService clientTransactionService;
    @Autowired
    private HealthDataService healthDataService;
    
    /**
     * Endpoint to list all users.
     *
     * @return a list of user responses
     */
    @GetMapping("/users")
    public ResponseEntity<List<AppUserResponse>> listUsers() {
        List<AppUserResponse> users = appUserService.findAll().stream()
                .map(AppUserResponse::userToResponse)
                .toList();
        return ResponseEntity.ok(users);
    }

    /**
     * Endpoint to get a user by email.
     *
     * @return the user response
     */
    @GetMapping("/user")
    public ResponseEntity<AppUserResponse> getUser(@RequestBody String email) {
        AppUser user = appUserService.findByEmail(email);
        return ResponseEntity.ok(AppUserResponse.userToResponse(user));
    }

    /**
     * Endpoint to update an existing user.
     *
     * @param appUser the updated user details
     * @return the updated user response
     */
    @PutMapping("/users")
    public ResponseEntity<AppUserResponse> updateUserByEmail(
            @RequestParam String email,
            @RequestBody AppUser updatedUser
    ) {
        return ResponseEntity.ok(
                AppUserResponse.userToResponse(
                        appUserService.updateUserDetailsByEmail(email, updatedUser)
                ));
    }

    @PostMapping("/users/addStock")
    public ResponseEntity<String>addStockToDeliveryMan(@RequestParam Long productId,@RequestParam int quantity,@RequestParam String delivererEmail){
        boolean success = appUserService.addStockToDeliveryMan(productId,quantity,delivererEmail);

        if (success){
            return ResponseEntity.ok("Stock added successfully");
        }else {
            return ResponseEntity.badRequest().body("Failed to add stock");
        }
    }

    /**
     * Endpoint to get the stock of a delivery man by email.
     *
     * @param email the email of the delivery man
     * @return the list of products in the delivery man's stock
     */
    @GetMapping("/users/{email}/stock")
    public ResponseEntity<List<DeliveryManStock>> getDeliveryManStock(@PathVariable String email) {
        AppUser deliveryMan = appUserService.findByEmail(email);
        if (deliveryMan == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(deliveryMan.getDeliveryManStock());
    }


    /**
     * Endpoint to get the stock of a client by email.
     *
     * @param clientId the ID of the client
     * @return the list of products in the client's stock
     */
    @GetMapping("/clients/{clientId}/stock")
    public ResponseEntity<List<ClientStock>> getClientStock(@PathVariable Long clientId) {
       AppClient client = appClientService.findById(clientId).orElseThrow(() -> new IllegalArgumentException("Client not found"));
        if (client == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(client.getClientStock());
    }

    @PostMapping("/clients/{clientId}/stock/add")
    public ResponseEntity<?> addClientStock(@PathVariable Long clientId, @RequestParam Long productId, @RequestParam int quantity) {
        AppClient client = appClientService.findById(clientId).orElseThrow(() -> new IllegalArgumentException("Client not found"));
        Product product = productService.findById(productId);
        if (product == null) {
            return ResponseEntity.badRequest().body("Product not found");
        }
        ClientStock existing = clientStockRepository.findByClientAndProduct(client, product);
        if (existing != null) {
            existing.setQuantity(existing.getQuantity() + quantity);
            clientStockRepository.save(existing);
        } else {
            ClientStock stock = new ClientStock();
            stock.setClient(client);
            stock.setProduct(product);
            stock.setQuantity(quantity);
            clientStockRepository.save(stock);
            client.getClientStock().add(stock);
            appClientService.save(client);
        }
        clientTransactionService.recordProduct(client, product, quantity, client.getDebt(), ClientTransactionType.PRODUCT_DELIVERY);
        return ResponseEntity.ok("Client stock updated");
    }

    @PostMapping("/clients/{clientId}/stock/remove")
    public ResponseEntity<?> removeClientStock(@PathVariable Long clientId, @RequestParam Long productId, @RequestParam int quantity) {
        AppClient client = appClientService.findById(clientId).orElseThrow(() -> new IllegalArgumentException("Client not found"));
        Product product = productService.findById(productId);
        if (product == null) {
            return ResponseEntity.badRequest().body("Product not found");
        }
        ClientStock existing = clientStockRepository.findByClientAndProduct(client, product);
        if (existing == null) {
            return ResponseEntity.badRequest().body("Product not found in client stock");
        }
        if (existing.getQuantity() < quantity) {
            return ResponseEntity.badRequest().body("Insufficient product quantity in client stock");
        }
        existing.setQuantity(existing.getQuantity() - quantity);
        if (existing.getQuantity() == 0) {
            client.getClientStock().remove(existing);
            clientStockRepository.delete(existing);
            appClientService.save(client);
        } else {
            clientStockRepository.save(existing);
        }
        clientTransactionService.recordProduct(client, product, quantity, client.getDebt(), ClientTransactionType.PRODUCT_RETURN);
        return ResponseEntity.ok("Client stock updated");
    }

    @PostMapping("/users/disable")
    public ResponseEntity<?> disableUser(@RequestParam String email) {
        AppUser disabledUser = appUserService.disable(email);
        if (disabledUser == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok("User disabled successfully");
    }

    @PostMapping("/users/enable")
	public ResponseEntity<?> enableUser(@RequestParam String email) {
		AppUser enabledUser = appUserService.enable(email);
		if (enabledUser == null) {
			return ResponseEntity.notFound().build();
		}
		return ResponseEntity.ok("User enabled successfully");
	}

    @PostMapping("/users/incrementEarnings")
    public ResponseEntity<?> incrementDailyEarnings(@RequestParam String email, @RequestParam BigDecimal amount) {
        AppUser updatedUser = appUserService.incrementDailyEarnings(email, amount);
        return ResponseEntity.ok("Daily earnings incremented successfully for user: " + updatedUser.getEmail());
    }

    @PostMapping("/removeProductFromDeliveryMan")
    public ResponseEntity<?> removeProductFromDeliveryMan(@RequestParam String email, @RequestParam Long productId, @RequestParam int quantity) {
        deliveryService.removeProductFromDeliveryMan(email, productId, quantity);
        return ResponseEntity.ok("Product removed successfully from delivery man");
    }
    
    @GetMapping("/getMatchingDeliveries")
	public ResponseEntity<?> getMatchingDeliveries(@RequestParam String email) {
		return ResponseEntity.ok(deliveryService.getMatchingDeliveries(email));
	}

    @GetMapping("/health-data")
    public ResponseEntity<?> getManagementHealthData() {
        HealthData data = healthDataService.getHealthData();
        return ResponseEntity.ok(data);
    }

    @PostMapping("/health-data")
    public ResponseEntity<?> saveHealthData(@RequestBody Map<String, String> request) {
        String data = request.get("data");
        HealthData saved = healthDataService.saveHealthData(data);
        return ResponseEntity.ok(saved);
    }
}
