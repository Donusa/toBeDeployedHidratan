package hidra.tan.controllers;

import java.io.IOException;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import hidra.tan.logging.Log4jImpl;
import hidra.tan.requests.AuthenticationRequest;
import hidra.tan.requests.EmailUpdateRequest;
import hidra.tan.requests.PasswordUpdateRequest;
import hidra.tan.requests.RegisterRequest;
import hidra.tan.requests.ResetPasswordRequest;
import hidra.tan.responses.AuthenticationResponse;
import hidra.tan.services.AuthenticationService;
import hidra.tan.utils.SecurityUtils;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * Controller for handling authentication-related endpoints.
 */
@RestController
@RequestMapping("/api/v1/auth")
public class AuthenticationController {

	@Autowired
	private AuthenticationService authService;
	@Autowired
	private Log4jImpl logger = Log4jImpl.getInstance();
	
	/**
	 * Endpoint for user registration.
	 *
	 * @param request the registration request containing user details
	 * @return the authentication response containing the JWT token
	 * @throws IOException if an I/O error occurs during registration
	 */
	@PostMapping("/register")
	public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
		logger.logInfo("Register endpoint hit with email: " + request.getEmail());

		if (authService.emailExists(request.getEmail())) {
			logger.logError("Email already exists: " + request.getEmail());
			return ResponseEntity.status(HttpStatus.CONFLICT).body("Email already exists");
		}
		String challenge = SecurityUtils.passwordChallenge((request.getPassword()));
		if (!"Password is safe".equals(challenge)) {
			logger.logError("Password is not safe: " + request.getEmail());
			return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(challenge);
		}
		AuthenticationResponse response = authService.register(request);
		logger.logInfo("User registered successfully: " + request.getEmail());
		return ResponseEntity.ok(response);
	}

	/**
	 * Endpoint for user authentication.
	 *
	 * @param request the authentication request containing user credentials
	 * @return the authentication response containing the JWT token
	 */
	@PostMapping("/authenticate")
	public ResponseEntity<AuthenticationResponse> register(@RequestBody AuthenticationRequest request) {
		logger.logInfo("Authenticate endpoint hit with email: " + request.getEmail());
		AuthenticationResponse response = authService.authenticate(request);
		logger.logInfo("User authenticated successfully: " + request.getEmail());
		return ResponseEntity.ok(response);
	}

	/**
	 * Endpoint for user logout.
	 *
	 * @param request  the HTTP request
	 * @param response the HTTP response
	 */
	@GetMapping("/logout")
	public void logout(HttpServletRequest request, HttpServletResponse response) {
		logger.logInfo("Logout endpoint hit for user: " + request.getUserPrincipal().getName());
		authService.logout(request, response);
		logger.logInfo("User logged out successfully: " + request.getUserPrincipal().getName());
	}

	/**
	 * Endpoint for refreshing the JWT token.
	 *
	 * @param request  the HTTP request
	 * @param response the HTTP response
	 * @throws IOException if an I/O error occurs during token refresh
	 */
	@PostMapping("/refresh-token")
	public void refreshToken(HttpServletRequest request, HttpServletResponse response) throws IOException {
		logger.logInfo("Refresh token endpoint hit for user: " + request.getUserPrincipal().getName());
		authService.refreshToken(request, response);
		logger.logInfo("Token refreshed successfully for user: " + request.getUserPrincipal().getName());
	}
	
	@PostMapping("/update-password")
	public ResponseEntity<?> updatePassword(@RequestBody PasswordUpdateRequest request) {
		logger.logInfo("Update password endpoint hit with email: " + request.getEmail());
		String challenge = SecurityUtils.passwordChallenge((request.getPassword()));
		if (!"Password is safe".equals(challenge)) {
			logger.logError("Password is not safe: " + request.getEmail());
			return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(challenge);
		}
		authService.updatePassword(request);
		logger.logInfo("Password updated successfully: " + request.getEmail());
		return ResponseEntity.ok("Password updated successfully");
	}
	
	@PostMapping("/update-email")
	public ResponseEntity<?> updateEmail(@RequestBody EmailUpdateRequest request) {
		logger.logInfo("Update email endpoint hit with email: " + request.getEmail());
		authService.updateEmail(request);
		logger.logInfo("Email updated successfully: " + request.getEmail());
		return ResponseEntity.ok("Email updated successfully");
	}
	
	@PostMapping("forgot-password")
	public ResponseEntity<?> forgotPassword(@RequestBody AuthenticationRequest request) {
		logger.logInfo("Forgot password endpoint hit with email: " + request.getEmail());
		authService.forgotPassword(request);
		logger.logInfo("Forgot password email sent successfully: " + request.getEmail());
		return ResponseEntity.ok("Forgot password email sent successfully");
	}

	@PostMapping("/reset-password")
	public ResponseEntity<?> resetPassword(@RequestBody ResetPasswordRequest request) {
		logger.logInfo("Reset password endpoint hit with token");
		try {
			authService.resetPassword(request.getToken(), request.getNewPassword());
			logger.logInfo("Password reset successfully");
			return ResponseEntity.ok("Password reset successfully");
		} catch (IllegalArgumentException e) {
			logger.logError("Invalid reset attempt: " + e.getMessage());
			return ResponseEntity.badRequest().body(e.getMessage());
		} catch (Exception e) {
			logger.logError("Error resetting password", e);
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
							   .body("An error occurred while resetting the password");
		}
	}
}
