package com.rowentey.jobwise.services;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import java.util.Date;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.orm.jpa.JpaSystemException;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;

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

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private JwtUtil jwtUtil;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private AuthenticationManager authenticationManager;
    @Mock
    private UserService userService;
    @Mock
    private RefreshTokenService refreshTokenService;
    @Mock
    private UserMapper userMapper;

    @InjectMocks
    private AuthService authService;

    private SignUpRequest signUpRequest() {
        SignUpRequest request = new SignUpRequest();
        request.setUsername("newuser");
        request.setEmail("new@example.com");
        request.setPassword("password123");
        return request;
    }

    private User user() {
        User user = new User();
        user.setId(1L);
        user.setUsername("testuser");
        user.setEmail("test@example.com");
        user.setPassword("encodedPassword");
        user.setRoles("ADMIN");
        return user;
    }

    @Test
    void signUp_shouldSucceed() throws Exception {
        SignUpRequest request = signUpRequest();
        User user = new User();
        user.setUsername("newuser");
        user.setEmail("new@example.com");
        user.setPassword("password123");

        when(userMapper.toEntity(request)).thenReturn(user);
        when(passwordEncoder.encode("password123")).thenReturn("encodedPassword");
        when(userService.createUser(any(User.class))).thenReturn(user);

        authService.signUp(request);

        verify(userMapper).toEntity(request);
        verify(passwordEncoder).encode("password123");
        verify(userService).createUser(user);
        assertEquals("encodedPassword", user.getPassword());
    }

    @Test
    void signUp_shouldThrowUsernameExistsException() throws Exception {
        SignUpRequest request = signUpRequest();
        User user = new User();
        user.setUsername("newuser");
        user.setPassword("password123");

        when(userMapper.toEntity(request)).thenReturn(user);
        when(passwordEncoder.encode(any())).thenReturn("encoded");

        JpaSystemException jpaEx = mock(JpaSystemException.class);
        when(jpaEx.getRootCause()).thenReturn(new Throwable("UNIQUE constraint failed: users.username"));
        when(userService.createUser(any(User.class))).thenThrow(jpaEx);

        assertThrows(UsernameExistsException.class, () -> authService.signUp(request));
    }

    @Test
    void signUp_shouldThrowEmailExistsException() throws Exception {
        SignUpRequest request = signUpRequest();
        User user = new User();
        user.setEmail("existing@example.com");
        user.setPassword("password123");

        when(userMapper.toEntity(request)).thenReturn(user);
        when(passwordEncoder.encode(any())).thenReturn("encoded");

        JpaSystemException jpaEx = mock(JpaSystemException.class);
        when(jpaEx.getRootCause()).thenReturn(new Throwable("UNIQUE constraint failed: users.email"));
        when(userService.createUser(any(User.class))).thenThrow(jpaEx);

        assertThrows(EmailExistsException.class, () -> authService.signUp(request));
    }

    @Test
    void login_shouldReturnTokens() {
        LoginRequest request = new LoginRequest();
        request.setUsername("testuser");
        request.setPassword("password123");

        User user = user();
        Authentication authentication = mock(Authentication.class);
        when(authentication.getPrincipal()).thenReturn(user);
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenReturn(authentication);
        when(jwtUtil.generateAccessToken(user)).thenReturn("access-token");
        when(jwtUtil.generateRefreshToken(user)).thenReturn("refresh-token");
        when(jwtUtil.extractExpiration(anyString())).thenReturn(new Date(System.currentTimeMillis() + 3600000));

        AuthLoginResponse response = authService.login(request);

        assertNotNull(response);
        assertEquals("access-token", response.getAccessToken());
        assertEquals("refresh-token", response.getRefreshToken());
        verify(refreshTokenService).createToken(any(), anyString(), any());
    }

    @Test
    void login_shouldThrowOnBadCredentials() {
        LoginRequest request = new LoginRequest();
        request.setUsername("testuser");
        request.setPassword("wrongpassword");

        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenThrow(new AuthenticationException("Bad credentials") {
                });

        assertThrows(AuthenticationException.class, () -> authService.login(request));
    }

    @Test
    void refreshToken_shouldReturnNewTokens() throws Exception {
        String oldRefreshToken = "old-refresh-token";
        User user = user();

        when(jwtUtil.extractTokenType(oldRefreshToken)).thenReturn("refresh");
        when(refreshTokenService.validateTokenAndGetUser(oldRefreshToken)).thenReturn(user);
        when(jwtUtil.generateAccessToken(user)).thenReturn("new-access-token");
        when(jwtUtil.generateRefreshToken(user)).thenReturn("new-refresh-token");
        when(jwtUtil.extractExpiration("new-refresh-token"))
                .thenReturn(new Date(System.currentTimeMillis() + 3600000));

        AuthLoginResponse response = authService.refreshToken(oldRefreshToken);

        assertNotNull(response);
        assertEquals("new-access-token", response.getAccessToken());
        assertEquals("new-refresh-token", response.getRefreshToken());
        verify(refreshTokenService).revokeToken(oldRefreshToken);
        verify(refreshTokenService).createToken(eq(user), eq("new-refresh-token"), any());
    }

    @Test
    void refreshToken_shouldThrowOnInvalidTokenType() {
        String token = "access-token";
        when(jwtUtil.extractTokenType(token)).thenReturn("access");

        assertThrows(InvalidRefreshTokenException.class, () -> authService.refreshToken(token));
    }

    @Test
    void logout_shouldRevokeToken() throws Exception {
        String refreshToken = "refresh-token";
        LogoutRequest request = new LogoutRequest();
        request.setRefreshToken(refreshToken);

        authService.logout(request);

        verify(refreshTokenService).revokeToken(refreshToken);
    }

    @Test
    void logout_shouldDoNothingWhenRequestIsNull() throws Exception {
        authService.logout(null);
        verify(refreshTokenService, never()).revokeToken(anyString());
        verify(refreshTokenService, never()).revokeAllUserTokens(anyLong());
    }
}
