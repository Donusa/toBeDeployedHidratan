
package hidra.tan.configurations;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import hidra.tan.logging.Log4jImpl;
import hidra.tan.repositories.UserRepository;

/**
 * Configuration class for application security and authentication.
 */
@Configuration
@EnableScheduling
public class ApplicationConfig {

    @Autowired
    private UserRepository userRepository;
    @Autowired
    private Log4jImpl logger = Log4jImpl.getInstance();

    /**
     * Bean for UserDetailsService.
     * 
     * @return UserDetailsService implementation that retrieves user details from the database.
     */
    @Bean
    UserDetailsService userDetailsService() {
        logger.logInfo("Initializing userDetailsService");

        return username -> {
            logger.logInfo("Searching user with email: " + username);
            return userRepository.findByEmail(username)
                    .orElseThrow(() -> {
                        logger.logError("User not found: " + username);
                        return new UsernameNotFoundException("user not found");
                    });
        };
    }

    /**
     * Bean for AuthenticationProvider.
     * 
     * @return AuthenticationProvider implementation using DaoAuthenticationProvider.
     */
    @Bean
    AuthenticationProvider authenticationProvider() {
        logger.logInfo("Configurando AuthenticationProvider");

        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
        authProvider.setUserDetailsService(userDetailsService());
        authProvider.setPasswordEncoder(passwordEncoder());

        logger.logInfo("AuthenticationProvider configurado correctamente");
        return authProvider;
    }

    /**
     * Bean for PasswordEncoder.
     * 
     * @return PasswordEncoder implementation using BCryptPasswordEncoder.
     */
    @Bean
    PasswordEncoder passwordEncoder() {
        logger.logInfo("Creando PasswordEncoder con BCryptPasswordEncoder");
        return new BCryptPasswordEncoder();
    }

    /**
     * Bean for AuthenticationManager.
     * 
     * @param config AuthenticationConfiguration to configure the AuthenticationManager.
     * @return Configured AuthenticationManager.
     * @throws Exception if an error occurs during configuration.
     */
    @Bean
    AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        logger.logInfo("Iniciando configuración del AuthenticationManager");

        try {
            AuthenticationManager authManager = config.getAuthenticationManager();
            logger.logInfo("AuthenticationManager configurado correctamente");
            return authManager;
        } catch (Exception e) {
            logger.logError("Error al configurar el AuthenticationManager", e);
            throw e;
        }
    }
}
