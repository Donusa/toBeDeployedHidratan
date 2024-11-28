
package hidra.tan.controllers;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import hidra.tan.entities.AppUser;
import hidra.tan.responses.AppUserResponse;
import hidra.tan.services.AppUserService;

/**
 * Controller for managing application users.
 */
@RestController
@PreAuthorize("hasRole('ROLE_ADMIN')")
@RequestMapping("/api/v1/managment")
public class ManagmentController {

    @Autowired
    private AppUserService appUserService;

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
    public ResponseEntity<AppUserResponse> updateUser(
    		@RequestBody AppUser appUser,
    		@RequestParam String email
    		) {
        return ResponseEntity.ok(
        		AppUserResponse.userToResponse(
        				appUserService.update(email, appUser)
        				));
    }

    @PostMapping("/users/disable")
	public ResponseEntity<?> disableUser(@RequestBody String email) {
		AppUser disabledUser = appUserService.disable(email);
		if (disabledUser == null) {
			return ResponseEntity.notFound().build();
		}
		return ResponseEntity.ok("User disabled successfully");
	}

}
