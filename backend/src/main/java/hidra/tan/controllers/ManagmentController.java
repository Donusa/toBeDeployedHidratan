
package hidra.tan.controllers;

import java.util.List;
import java.util.stream.Collectors;

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
import hidra.tan.responses.AppUserResponse;
import hidra.tan.services.AppClientService;
import hidra.tan.services.AppUserService;
import hidra.tan.services.DailyTotalHistoryService;

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
    private DailyTotalHistoryService dailyTotalHistoryService;

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

    @PostMapping("/users/disable")
    public ResponseEntity<?> disableUser(@RequestBody String email) {
        AppUser disabledUser = appUserService.disable(email);
        if (disabledUser == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok("User disabled successfully");
    }

    @PostMapping("/users/enable")
	public ResponseEntity<?> enableUser(@RequestBody String email) {
		AppUser enabledUser = appUserService.enable(email);
		if (enabledUser == null) {
			return ResponseEntity.notFound().build();
		}
		return ResponseEntity.ok("User enabled successfully");
	}
    
    @GetMapping("/histories")
	public ResponseEntity<?> getHistory() {
    	var list = dailyTotalHistoryService.getDailyTotalHistories();
    	var dto = list.stream()
                .map(h -> dailyTotalHistoryService.mapToDto(h))
                .collect(Collectors.toList());
		return ResponseEntity.ok(dto);
	}
    
    @GetMapping("/getMatchingDeliveries")
	public ResponseEntity<?> getMatchingDeliveries(@RequestParam String email) {
		return ResponseEntity.ok(appUserService.getMatchingDeliveries(email));
	}
}
