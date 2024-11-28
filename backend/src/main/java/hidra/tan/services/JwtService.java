package hidra.tan.services;

import java.security.Key;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;


import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import hidra.tan.entities.AppUser;
import hidra.tan.enums.Roles;
import hidra.tan.logging.Log4jImpl;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;

@Service
public class JwtService {

	@Autowired
	private Log4jImpl logger = Log4jImpl.getInstance();

	@Value("${SECRET_KEY}")
	private String SECRET_KEY;

	public <T> T extractClaims(String token, Function<Claims, T> claimsResolver) {
		logger.logInfo("Extracting claims from token...");
	    final Claims claims = extractAllClaims(token);
		return claimsResolver.apply(claims);
	}

	public String extractUsername(String token) {
		logger.logInfo("Extracting username from token...");
	    return extractClaims(token, Claims::getSubject);
	}

	private Claims extractAllClaims(String token) {
	    logger.logInfo("Extracting all claims from token...");
		return Jwts
				.parserBuilder()
				.setSigningKey(getSignInKey())
				.build()
				.parseClaimsJws(token)
				.getBody();
	}

	public String generateToken(
			Map<String, Object> extractClaims,
			UserDetails userDetails
			) {
		logger.logInfo("Generating token for user: "+ userDetails.getUsername());
		return Jwts
				.builder()
				.setClaims(extractClaims)
				.setSubject(userDetails.getUsername())
				.setIssuedAt(new Date(System.currentTimeMillis()))
				.setExpiration(new Date(System.currentTimeMillis() + 1000 * 60 * 60 * 16))
				.signWith(getSignInKey(), SignatureAlgorithm.HS256).compact();
	}

	public String generateToken(UserDetails userDetails) {
		Map<String, Object> claims = new HashMap<>();
	    if (userDetails instanceof AppUser) {
	        claims.put("role", ((AppUser) userDetails).getRole());
	    }
		return generateToken(claims, userDetails);
	}

	public boolean isTokenValid(String token, UserDetails userDetails) {
	    logger.logInfo("Checking validity of token for user: "+ userDetails.getUsername());
		final String username = extractUsername(token);
		boolean isValid = username.equals(userDetails.getUsername()) && !isTokenExpired(token);
	    logger.logInfo("Token valid: "+ isValid);
	    return isValid;
	}

	private boolean isTokenExpired(String token) {
	    logger.logInfo("Checking if token is expired...");
		return extractExpiration(token).before(new Date());
	}

	private Date extractExpiration(String token) {
	    logger.logInfo("Extracting expiration date from token...");
		return extractClaims(token, Claims::getExpiration);
	}
	
	public Roles extractRoles(String token) {
	    return extractClaims(token, claims -> claims.get("role", Roles.class));
	}
	
	private Key getSignInKey() {
	    logger.logInfo("Getting signing key...");
		byte[] keyBytes = Decoders.BASE64.decode(SECRET_KEY);
		return Keys.hmacShaKeyFor(keyBytes);
	}

	public String generateRefreshToken(AppUser user) {
		 logger.logInfo("Generating refresh token for user: " + user.getEmail());
		    return Jwts.builder()
		            .setSubject(user.getEmail())
		            .setClaims(Map.of("role", user.getRole()))
		            .setIssuedAt(new Date(System.currentTimeMillis()))
		            .setExpiration(new Date(System.currentTimeMillis() + 1000 * 60 * 60 * 24 * 7))
		            .signWith(getSignInKey(), SignatureAlgorithm.HS256)
		            .compact();
	}
}
