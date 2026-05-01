package com.rowentey.jobwise.services;

import java.util.Date;

import org.springframework.orm.jpa.JpaSystemException;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.rowentey.jobwise.dto.auth.AuthLoginResponse;
import com.rowentey.jobwise.dto.auth.LoginRequest;
import com.rowentey.jobwise.dto.auth.LogoutRequest;
import com.rowentey.jobwise.dto.auth.SignUpRequest;
import com.rowentey.jobwise.exceptions.AuthExceptions.EmailExistsException;
import com.rowentey.jobwise.exceptions.AuthExceptions.InvalidRefreshTokenException;
import com.rowentey.jobwise.exceptions.AuthExceptions.UsernameExistsException;
import com.rowentey.jobwise.mapper.UserMapper;
import com.rowentey.jobwise.models.User;
import com.rowentey.jobwise.utils.JwtUtil;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final JwtUtil jwtUtil;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final UserService userService;
    private final RefreshTokenService refreshTokenService;
    private final UserMapper userMapper;

    public record TokenPair(String accessToken, String refreshToken) {
    }

    public void signUp(SignUpRequest request)
            throws UsernameExistsException, EmailExistsException {
        User user = userMapper.toEntity(request);
        user.setPassword(passwordEncoder.encode(user.getPassword()));

        // TODO: Think through this flow
        if (user.getRoles() == null || user.getRoles().isBlank()) {
            user.setRoles("ADMIN");
        }

        try {
            userService.createUser(user);
        } catch (JpaSystemException e) {
            Throwable root = e.getRootCause();
            String message = root.getMessage();
            if (message != null && message.contains("UNIQUE constraint failed: users.username")) {
                log.warn("Attempt to register with existing username: {}", user.getUsername());
                throw new UsernameExistsException("Username already exists");
            } else if (message != null && message.contains("UNIQUE constraint failed: users.email")) {
                log.warn("Attempt to register with existing email: {}", user.getEmail());
                throw new EmailExistsException("Email already exists");
            }

            log.error("Error occurred during user registration: {}", root.getMessage());
            throw e;
        }
    }

    public AuthLoginResponse login(LoginRequest request) throws AuthenticationException {
        Authentication authentication = authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(
                request.getUsername(), request.getPassword()));
        User user = authentication.getPrincipal() instanceof User ? (User) authentication.getPrincipal() : null;
        if (user == null) {
            throw new AuthenticationException("Authentication failed for user " + request.getUsername()) {
            };
        }

        TokenPair tokenPair = issueTokenPair(user);
        return new AuthLoginResponse(tokenPair.accessToken(),
                tokenPair.refreshToken());
    }

    @Transactional
    public AuthLoginResponse refreshToken(String rawRefreshToken) throws InvalidRefreshTokenException {
        try {
            if (!"refresh".equals(jwtUtil.extractTokenType(rawRefreshToken))) {
                throw new InvalidRefreshTokenException("Invalid token type for refresh operation");
            }
        } catch (Exception ex) {
            throw new InvalidRefreshTokenException("Refresh token is invalid");
        }

        User user = refreshTokenService.validateTokenAndGetUser(rawRefreshToken);

        refreshTokenService.revokeToken(rawRefreshToken);
        String newAccessToken = jwtUtil.generateAccessToken(user);
        String newRefreshToken = jwtUtil.generateRefreshToken(user);
        refreshTokenService.createToken(user, newRefreshToken,
                jwtUtil.extractExpiration(newRefreshToken));

        return new AuthLoginResponse(newAccessToken, newRefreshToken);
    }

    @Transactional
    public void logout(LogoutRequest request) throws InvalidRefreshTokenException {
        if (request != null && request.isLogoutAllDevices()) {
            Long userId;
            try {
                userId = jwtUtil.extractUserId();
            } catch (Exception ex) {
                throw new InvalidRefreshTokenException(
                        "Access token is required for logoutAllDevices");
            }
            logoutFromAllDevices(userId);
        } else if (request != null && request.getRefreshToken() != null
                && !request.getRefreshToken().isBlank()) {
            logoutByRefreshToken(request.getRefreshToken());
        }

        SecurityContextHolder.clearContext();
    }

    private TokenPair issueTokenPair(User user) {
        String accessToken = jwtUtil.generateAccessToken(user);
        String refreshToken = jwtUtil.generateRefreshToken(user);
        Date refreshTokenExpiry = jwtUtil.extractExpiration(refreshToken);
        refreshTokenService.createToken(user, refreshToken, refreshTokenExpiry);
        return new TokenPair(accessToken, refreshToken);
    }

    private void logoutByRefreshToken(String rawRefreshToken) throws InvalidRefreshTokenException {
        refreshTokenService.revokeToken(rawRefreshToken);
    }

    private void logoutFromAllDevices(Long userId) {
        refreshTokenService.revokeAllUserTokens(userId);
    }
}
