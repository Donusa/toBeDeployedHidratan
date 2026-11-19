
package hidra.tan.configurations;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.authentication.logout.LogoutHandler;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import jakarta.servlet.DispatcherType;
import jakarta.servlet.Filter;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.core.Ordered;

import hidra.tan.enums.Roles;
import hidra.tan.logging.Log4jImpl;

/**
 * Configuration class for setting up security configurations.
 */
@Configuration
@EnableWebSecurity
public class SecurityConfiguration {

    @Autowired
    private JwtAuthenticationFilter jwtAuthFilter;
    @Autowired
    private AuthenticationProvider authenticationProvider;
    @Autowired
    private Log4jImpl logger = Log4jImpl.getInstance();
    @Autowired
    private LogoutHandler logoutHandler;

    private static final String[] WHITE_LIST = { "/api/v1/auth/**" };

    /**
     * Configures the security filter chain.
     *
     * @param http the HttpSecurity to modify
     * @return the configured SecurityFilterChain
     * @throws Exception if an error occurs during configuration
     */
    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http.csrf(csrf -> csrf.disable())
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .authorizeHttpRequests(auth -> {
                    logger.logInfo("Configuring access rules...");
                    auth.dispatcherTypeMatchers(
                            DispatcherType.ERROR,
                            DispatcherType.FORWARD
                        ).permitAll()
                        .requestMatchers("/error").permitAll()
                        .requestMatchers(WHITE_LIST).permitAll()
                        .requestMatchers(HttpMethod.DELETE, "/delivery/clients/{clientId}/transactions/{transactionId}")
                        .hasAuthority(Roles.ROLE_ADMIN.name())
                        .anyRequest().authenticated();
                })
                .sessionManagement(management -> {
                    logger.logInfo("Configuring session management...");
                    management.sessionCreationPolicy(SessionCreationPolicy.STATELESS);
                })
                .authenticationProvider(authenticationProvider)
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)
                .logout(logout -> logout.logoutUrl("/api/v1/auth/logout")
                        .addLogoutHandler(logoutHandler)
                        .logoutSuccessHandler((request, response, authentication) -> SecurityContextHolder.clearContext()));
        logger.logInfo("SecurityFilterChain configured successfully.");
        return http.build();
    }

    @Bean
    FilterRegistrationBean<Filter> dispatcherDebugFilter() {
        FilterRegistrationBean<Filter> registration = new FilterRegistrationBean<>();

        registration.setFilter((request, response, chain) -> {
            HttpServletRequest httpRequest = (HttpServletRequest) request;

            logger.logInfo(
                "DISPATCH DEBUG - Type: " + httpRequest.getDispatcherType()
                + " | URI: " + httpRequest.getRequestURI()
                + " | Original URI: " + httpRequest.getAttribute("jakarta.servlet.error.request_uri")
            );

            chain.doFilter(request, response);
        });

        registration.setOrder(Ordered.HIGHEST_PRECEDENCE);
        registration.setDispatcherTypes(
            DispatcherType.REQUEST,
            DispatcherType.ERROR,
            DispatcherType.FORWARD
        );

        return registration;
    }

    /**
     * Configures the CORS configuration source.
     *
     * @return the configured UrlBasedCorsConfigurationSource
     */
    @Bean
    UrlBasedCorsConfigurationSource corsConfigurationSource() {
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowCredentials(true);
        config.addAllowedOrigin("http://hidratan.com.ar");
        config.addAllowedHeader("*");
        config.addAllowedMethod("*");
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
