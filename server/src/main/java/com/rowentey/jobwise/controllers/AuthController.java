package com.rowentey.jobwise.controllers;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.rowentey.jobwise.config.SwaggerConfig;
import com.rowentey.jobwise.dto.ErrorResponse;
import com.rowentey.jobwise.dto.auth.AuthLoginResponse;
import com.rowentey.jobwise.dto.auth.LoginRequest;
import com.rowentey.jobwise.dto.auth.LogoutRequest;
import com.rowentey.jobwise.dto.auth.RefreshTokenRequest;
import com.rowentey.jobwise.dto.auth.SignUpRequest;
import com.rowentey.jobwise.exceptions.AuthExceptions.EmailExistsException;
import com.rowentey.jobwise.exceptions.AuthExceptions.InvalidRefreshTokenException;
import com.rowentey.jobwise.exceptions.AuthExceptions.UsernameExistsException;
import com.rowentey.jobwise.dto.auth.OAuthLoginRequest;
import com.rowentey.jobwise.services.AuthService;
import com.rowentey.jobwise.services.OAuthService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("api/v1/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "Authentication APIs")
@Tag(name = SwaggerConfig.UNSECURED)
public class AuthController {
        private final AuthService authService;
        private final OAuthService oAuthService;

        @ExceptionHandler(AuthenticationException.class)
        public ResponseEntity<ErrorResponse> handleAuthenticationException(AuthenticationException ex) {
                log.warn("User authentication failed! " + ex.getMessage());
                ErrorResponse errorResponse = new ErrorResponse("Invalid credentials - " + ex.getMessage());
                return new ResponseEntity<>(errorResponse, HttpStatus.UNAUTHORIZED);
        }

        @ExceptionHandler({ UsernameExistsException.class, EmailExistsException.class })
        public ResponseEntity<ErrorResponse> handleAlreadyExistException(Exception ex) {
                ErrorResponse errorResponse = new ErrorResponse(ex.getMessage());
                return new ResponseEntity<>(errorResponse, HttpStatus.CONFLICT);
        }

        @ExceptionHandler(InvalidRefreshTokenException.class)
        public ResponseEntity<ErrorResponse> handleInvalidRefreshTokenException(
                        InvalidRefreshTokenException ex) {
                ErrorResponse errorResponse = new ErrorResponse(ex.getMessage());
                return new ResponseEntity<>(errorResponse, HttpStatus.UNAUTHORIZED);
        }

        @Operation(summary = "Sign up a new user")
        @ApiResponses(value = {
                        @ApiResponse(responseCode = "201", description = "User registered successfully"),
                        @ApiResponse(responseCode = "400", description = "Invalid request data", content = {
                                        @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)) }),
                        @ApiResponse(responseCode = "409", description = "Username or email already exists", content = {
                                        @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)) }) })
        @PostMapping("/signup")
        public ResponseEntity<Void> signUp(@Valid @RequestBody SignUpRequest request)
                        throws UsernameExistsException, EmailExistsException {
                authService.signUp(request);
                return new ResponseEntity<>(HttpStatus.CREATED);
        }

        @Operation(summary = "Log in a user")
        @ApiResponses(value = {
                        @ApiResponse(responseCode = "200", description = "User authenticated successfully", content = {
                                        @Content(mediaType = "application/json", schema = @Schema(implementation = AuthLoginResponse.class)) }),
                        @ApiResponse(responseCode = "400", description = "Invalid request data", content = {
                                        @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)) }),
                        @ApiResponse(responseCode = "401", description = "Invalid credentials", content = {
                                        @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)) }) })
        @PostMapping("/login")
        public ResponseEntity<AuthLoginResponse> login(@Valid @RequestBody LoginRequest request)
                        throws AuthenticationException {
                log.info("Login request received for user: " + request.getUsername());
                AuthLoginResponse response = authService.login(request);
                return new ResponseEntity<>(response,
                                response.getAccessToken() == null ? HttpStatus.UNAUTHORIZED
                                                : HttpStatus.OK);
        }

        @Operation(summary = "Refresh access and refresh tokens")
        @ApiResponses(value = {
                        @ApiResponse(responseCode = "200", description = "Tokens refreshed successfully", content = {
                                        @Content(mediaType = "application/json", schema = @Schema(implementation = AuthLoginResponse.class)) }),
                        @ApiResponse(responseCode = "400", description = "Invalid request data", content = {
                                        @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)) }),
                        @ApiResponse(responseCode = "401", description = "Invalid refresh token", content = {
                                        @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)) })
        })
        @PostMapping("/refresh")
        public ResponseEntity<AuthLoginResponse> refresh(
                        @Valid @RequestBody RefreshTokenRequest request)
                        throws InvalidRefreshTokenException {
                return new ResponseEntity<>(authService.refreshToken(request.getRefreshToken()),
                                HttpStatus.OK);
        }

        @Operation(summary = "Log out a user")
        @ApiResponses(value = {
                        @ApiResponse(responseCode = "200", description = "Logged out successfully"),
                        @ApiResponse(responseCode = "400", description = "Invalid request data", content = {
                                        @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)) })
        })
        @PostMapping("/logout")
        public ResponseEntity<Void> logout(
                        @Valid @RequestBody(required = false) LogoutRequest request)
                        throws InvalidRefreshTokenException {
                authService.logout(request);
                return new ResponseEntity<>(HttpStatus.OK);
        }

        @Operation(summary = "Log in with OAuth provider")
        @ApiResponses(value = {
                        @ApiResponse(responseCode = "200", description = "User authenticated successfully", content = {
                                        @Content(mediaType = "application/json", schema = @Schema(implementation = AuthLoginResponse.class)) }),
                        @ApiResponse(responseCode = "400", description = "Invalid OAuth request", content = {
                                        @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)) })
        })
        @PostMapping("/oauth/{provider}")
        public ResponseEntity<AuthLoginResponse> loginWithOAuth(
                        @PathVariable String provider,
                        @Valid @RequestBody OAuthLoginRequest request) {
                AuthLoginResponse response = oAuthService.loginWithProvider(provider, request);
                return ResponseEntity.ok(response);
        }
}
