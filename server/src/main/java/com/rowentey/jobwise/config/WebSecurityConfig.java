package com.rowentey.jobwise.config;

import java.util.Arrays;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.ProviderManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import com.rowentey.jobwise.middleware.ApiKeyFilter;
import com.rowentey.jobwise.middleware.JwtFilter;

@Configuration
@EnableWebSecurity
public class WebSecurityConfig {
        @Bean
        protected SecurityFilterChain securityFilterChain(HttpSecurity http, JwtFilter jwtFilter,
                        ApiKeyFilter apiKeyFilter)
                        throws Exception {
                http.csrf(AbstractHttpConfigurer::disable)
                                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                                .sessionManagement(
                                                session -> session
                                                                .sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                                .authorizeHttpRequests(authorize -> authorize.requestMatchers("/v3/**",
                                                "/swagger-ui/**", "/favicon.ico", "/api/v1/auth/**",
                                                "/actuator/health/**")
                                                .permitAll().anyRequest().authenticated())
                                .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class)
                                .addFilterBefore(apiKeyFilter, JwtFilter.class);
                return http.build();
        }

        @Bean
        PasswordEncoder passwordEncoder() {
                return new BCryptPasswordEncoder(10);
        }

        @Bean
        AuthenticationManager authenticationManager(UserDetailsService userDetailsService,
                        PasswordEncoder passwordEncoder) {
                return new ProviderManager(
                                Arrays.asList(authenticationProvider(userDetailsService, passwordEncoder)));
        }

        CorsConfigurationSource corsConfigurationSource() {
                // TODO: Update allowed origins
                CorsConfiguration configuration = new CorsConfiguration();
                configuration.setAllowedOrigins(Arrays.asList("*")); // Allow all origins
                configuration
                                .setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
                configuration.setAllowedHeaders(Arrays.asList("*")); // Allow all headers

                UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
                source.registerCorsConfiguration("/**", configuration);
                return source;
        }

        AuthenticationProvider authenticationProvider(UserDetailsService userDetailsService,
                        PasswordEncoder passwordEncoder) {
                DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider(userDetailsService);
                authProvider.setPasswordEncoder(passwordEncoder);
                return authProvider;
        }
}
