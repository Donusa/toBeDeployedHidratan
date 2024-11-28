package hidra.tan.services;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.fasterxml.jackson.core.exc.StreamWriteException;
import com.fasterxml.jackson.databind.DatabindException;
import com.fasterxml.jackson.databind.ObjectMapper;

import hidra.tan.entities.AppUser;
import hidra.tan.entities.Token;
import hidra.tan.enums.Roles;
import hidra.tan.enums.TokenType;
import hidra.tan.logging.Log4jImpl;
import hidra.tan.repositories.TokenRepository;
import hidra.tan.repositories.UserRepository;
import hidra.tan.requests.AuthenticationRequest;
import hidra.tan.requests.EmailUpdateRequest;
import hidra.tan.requests.PasswordUpdateRequest;
import hidra.tan.requests.RegisterRequest;
import hidra.tan.responses.AuthenticationResponse;
import hidra.tan.utils.MailUtils;
import hidra.tan.utils.SecurityUtils;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Service
public class AuthenticationService {

    @Autowired
    private UserRepository userRepository;
    @Autowired
    private PasswordEncoder passwordEncoder;
    @Autowired
    private JwtService jwtService;
    @Autowired
    private AuthenticationManager authManager;
    @Autowired
    private TokenRepository tokenRepository;
    @Autowired
    private Log4jImpl logger = Log4jImpl.getInstance();
    @Autowired
    private MailUtils mailUtils;

    /**
     * Registers a new user.
     *
     * @param request the registration request containing user details
     * @return the authentication response containing the JWT token
     */
    public AuthenticationResponse register(RegisterRequest request) {
        logger.logInfo("Registering user with email: " + request.getEmail());
        Roles role = switch (request.getRole()) {
            case "ROLE_ADMIN" -> Roles.ROLE_ADMIN;
            case "ROLE_DELIVERY" -> Roles.ROLE_DELIVERY;
            default -> throw new IllegalArgumentException("Invalid role: " + request.getRole());
        };
        AppUser user = AppUser.builder()
                .email(request.getEmail())
                .pass(passwordEncoder.encode(request.getPassword()))
                .name(request.getName())
                .role(role)
                .active(true)
                .build();
        AppUser savedUser = userRepository.save(user);
        logger.logInfo("User registered successfully: " + savedUser.getEmail());
        String jwtToken = jwtService.generateToken(user);
        String refreshToken = jwtService.generateRefreshToken(user);
        saveUserToken(savedUser, jwtToken);
        logger.logInfo("Tokens generated for user: " + savedUser.getEmail());
        return AuthenticationResponse.builder()
                .accessToken(jwtToken)
                .refreshToken(refreshToken)
                .build();
    }

    /**
     * Saves the JWT token for the user.
     *
     * @param savedUser the user for whom the token is being saved
     * @param jwtToken the JWT token to save
     */
    private void saveUserToken(AppUser savedUser, String jwtToken) {
        logger.logInfo("Saving token for user: " + savedUser.getEmail());
        var token = Token.builder()
                .user(savedUser)
                .token(jwtToken)
                .tokenType(TokenType.BEARER)
                .expired(false)
                .revoked(false)
                .build();
        tokenRepository.save(token);
        logger.logInfo("Token saved for user: " + savedUser.getEmail());
    }

    /**
     * Authenticates a user.
     *
     * @param request the authentication request containing user credentials
     * @return the authentication response containing the JWT token
     */
    public AuthenticationResponse authenticate(AuthenticationRequest request) {
        logger.logInfo("Authenticating user with email: " + request.getEmail());
        authManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );
        var user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new UsernameNotFoundException("user not found"));
        var jwtToken = jwtService.generateToken(user);
        var refreshToken = jwtService.generateRefreshToken(user);
        revokeAllUserTokens(user);
        saveUserToken(user, jwtToken);
		if (user.getActive() == false) {
			throw new IllegalArgumentException("User is not active");
		}
        logger.logInfo("User authenticated and tokens generated for: " + user.getEmail());
        return AuthenticationResponse.builder()
                .accessToken(jwtToken)
                .refreshToken(refreshToken)
                .build();
    }

    /**
     * Revokes all tokens for a user.
     *
     * @param user the user whose tokens are to be revoked
     */
    private void revokeAllUserTokens(AppUser user) {
        logger.logInfo("Revoking all tokens for user: " + user.getEmail());
        var validUserTokens = tokenRepository.findAllValidTokenByUser(user.getId());
        if (validUserTokens.isEmpty()) return;
        validUserTokens.forEach(token -> {
            token.setExpired(true);
            token.setRevoked(true);
        });
        tokenRepository.saveAll(validUserTokens);
        logger.logInfo("All tokens revoked for user: " + user.getEmail());
    }

    /**
     * Refreshes the JWT token.
     *
     * @param request the HTTP request
     * @param response the HTTP response
     * @throws StreamWriteException if an error occurs during writing the response
     * @throws DatabindException if an error occurs during data binding
     * @throws IOException if an I/O error occurs
     */
    public void refreshToken(HttpServletRequest request, HttpServletResponse response)
            throws StreamWriteException, DatabindException, IOException {
        final String authHeader = request.getHeader(HttpHeaders.AUTHORIZATION);
        final String refreshToken;
        final String userEmail;
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            logger.logError("Invalid authorization header in refresh token request");
            return;
        }
        refreshToken = authHeader.substring(7);
        userEmail = jwtService.extractUsername(refreshToken);
        if (userEmail != null) {
            var user = this.userRepository.findByEmail(userEmail).orElseThrow();
            if (jwtService.isTokenValid(refreshToken, user)) {
                logger.logInfo("Valid refresh token for user: " + userEmail);
                var accessToken = jwtService.generateToken(user);
                revokeAllUserTokens(user);
                saveUserToken(user, accessToken);
                var authResponse = AuthenticationResponse.builder()
                        .accessToken(accessToken)
                        .refreshToken(refreshToken)
                        .build();
                new ObjectMapper().writeValue(response.getOutputStream(), authResponse);
                logger.logInfo("Access token refreshed for user: " + userEmail);
            } else {
                logger.logError("Invalid refresh token for user: " + userEmail);
            }
        } else {
            logger.logError("User email extraction failed from refresh token");
        }
    }

    /**
     * Logs out a user.
     *
     * @param request the HTTP request
     * @param response the HTTP response
     */
    public void logout(HttpServletRequest request, HttpServletResponse response) {
        logger.logInfo("Logging out user: " + request.getUserPrincipal().getName());
        String authHeader = request.getHeader(HttpHeaders.AUTHORIZATION);
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            logger.logError("Invalid authorization header in logout request");
            return;
        }
        String accessToken = authHeader.substring(7);
        String userEmail = jwtService.extractUsername(accessToken);
        if (userEmail != null) {
            var user = userRepository.findByEmail(userEmail).orElseThrow();
            var userTokens = tokenRepository.findAllValidTokenByUser(user.getId());
            userTokens.forEach(token -> {
                token.setExpired(true);
                token.setRevoked(true);
            });
            tokenRepository.saveAll(userTokens);
            logger.logInfo("User logged out successfully: " + userEmail);
        } else {
            logger.logError("User email extraction failed from access token");
        }
    }

	public boolean emailExists(String email) {
    return userRepository.findByEmail(email).isPresent();
}

	public void updatePassword(PasswordUpdateRequest request) {
		logger.logInfo("Updating password for user with email: " + request.getEmail());
		AppUser user = userRepository.findByEmail(request.getEmail()).orElseThrow();
		String currPass = user.getPassword();
		if (!passwordEncoder.matches(request.getPassword(), currPass)) {
			throw new IllegalArgumentException("Incorrect current password");
		}
		user.setPass(passwordEncoder.encode(request.getNewPassword()));
		userRepository.save(user);
		logger.logInfo("Password updated successfully for user: " + request.getEmail());
	}

	public void updateEmail(EmailUpdateRequest request) {
		if(emailExists(request.getNewEmail())) {
            throw new IllegalArgumentException("Email already exists");
		}
		logger.logInfo("Updating email for user with email: " + request.getEmail());
        AppUser user = userRepository.findByEmail(request.getEmail()).orElseThrow();
        user.setEmail(request.getNewEmail());
        userRepository.save(user);
        logger.logInfo("Email updated successfully for user: " + request.getEmail());
	}

	public void forgotPassword(AuthenticationRequest request) {
		logger.logInfo("Processing forgot password request for email: " + request.getEmail());
		
		var user = userRepository.findByEmail(request.getEmail())
				.orElseThrow(() -> new UsernameNotFoundException("User not found"));
		
		String resetToken = generateResetToken();
		
		user.setResetToken(resetToken);
		user.setResetTokenExpiry(LocalDateTime.now().plusMinutes(15));
		userRepository.save(user);
		
		mailUtils.sendPasswordResetEmail(user.getEmail(), resetToken);
		
		logger.logInfo("Forgot password email sent successfully for user: " + request.getEmail());
	}

	private String generateResetToken() {
		return UUID.randomUUID().toString();
	}

	public void resetPassword(String token, String newPassword) {
		var user = userRepository.findByResetToken(token)
				.orElseThrow(() -> new IllegalArgumentException("Invalid reset token"));

		if (user.getResetTokenExpiry().isBefore(LocalDateTime.now())) {
			throw new IllegalArgumentException("Reset token has expired");
		}

		String challenge = SecurityUtils.passwordChallenge(newPassword);
		if (!"Password is safe".equals(challenge)) {
			throw new IllegalArgumentException(challenge);
		}

		user.setPass(passwordEncoder.encode(newPassword));
		user.setResetToken(null);
		user.setResetTokenExpiry(null);
		userRepository.save(user);
	}
}
