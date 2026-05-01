package com.rowentey.jobwise.services;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Date;
import java.util.Map;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.RestTemplate;

import com.rowentey.jobwise.dto.auth.AuthLoginResponse;
import com.rowentey.jobwise.dto.auth.OAuthLoginRequest;
import com.rowentey.jobwise.models.User;
import com.rowentey.jobwise.models.UserOAuthAccount;
import com.rowentey.jobwise.repository.UserOAuthAccountRepository;
import com.rowentey.jobwise.repository.UserRepository;
import com.rowentey.jobwise.utils.JwtUtil;

@ExtendWith(MockitoExtension.class)
class OAuthServiceTest {

        @Mock
        private JwtUtil jwtUtil;
        @Mock
        private PasswordEncoder passwordEncoder;
        @Mock
        private UserRepository userRepository;
        @Mock
        private UserOAuthAccountRepository oauthAccountRepository;
        @Mock
        private RefreshTokenService refreshTokenService;
        @Mock
        private RestTemplateBuilder restTemplateBuilder;
        @Mock
        private RestTemplate restTemplate;

        private OAuthService oAuthService;

        @Captor
        private ArgumentCaptor<User> userCaptor;
        @Captor
        private ArgumentCaptor<UserOAuthAccount> oauthCaptor;

        @BeforeEach
        void setUp() {
                lenient().when(restTemplateBuilder.build()).thenReturn(restTemplate);
                oAuthService = new OAuthService(jwtUtil, passwordEncoder, userRepository,
                                oauthAccountRepository, refreshTokenService, restTemplateBuilder);
                ReflectionTestUtils.setField(oAuthService, "googleClientId", "test-google-client-id");
                ReflectionTestUtils.setField(oAuthService, "googleClientSecret", "test-google-client-secret");
                ReflectionTestUtils.setField(oAuthService, "githubClientId", "test-github-client-id");
                ReflectionTestUtils.setField(oAuthService, "githubClientSecret", "test-github-client-secret");
        }

        @Test
        void loginWithProvider_google_newUser_shouldCreateUserAndReturnTokens() {
                OAuthLoginRequest request = new OAuthLoginRequest("google-code", "http://localhost:5173/callback");

                Map<String, Object> tokenResponseBody = Map.of("access_token", "google-access-token");
                Map<String, Object> userInfoBody = Map.of(
                                "sub", "google123",
                                "email", "newuser@gmail.com",
                                "name", "New User");

                when(restTemplate.postForEntity(eq("https://oauth2.googleapis.com/token"), any(), eq(Map.class)))
                                .thenReturn(ResponseEntity.ok(tokenResponseBody));
                when(restTemplate.exchange(eq("https://www.googleapis.com/oauth2/v3/userinfo"),
                                eq(HttpMethod.GET), any(), eq(Map.class)))
                                .thenReturn(ResponseEntity.ok(userInfoBody));

                when(oauthAccountRepository.findByProviderAndProviderUserId("google", "google123"))
                                .thenReturn(Optional.empty());
                when(userRepository.findByEmail("newuser@gmail.com"))
                                .thenReturn(Optional.empty());
                when(userRepository.findByUsername("new_user"))
                                .thenReturn(Optional.empty());
                when(passwordEncoder.encode(anyString())).thenReturn("encoded-random-password");

                User savedUser = new User();
                savedUser.setId(10L);
                savedUser.setUsername("new_user");
                when(userRepository.save(any(User.class))).thenReturn(savedUser);
                when(oauthAccountRepository.save(any(UserOAuthAccount.class)))
                                .thenAnswer(i -> i.getArgument(0));

                when(jwtUtil.generateAccessToken(savedUser)).thenReturn("access-token");
                when(jwtUtil.generateRefreshToken(savedUser)).thenReturn("refresh-token");
                when(jwtUtil.extractExpiration("refresh-token"))
                                .thenReturn(new Date(System.currentTimeMillis() + 3600000));

                AuthLoginResponse response = oAuthService.loginWithProvider("google", request);

                assertNotNull(response);
                assertEquals("access-token", response.getAccessToken());
                assertEquals("refresh-token", response.getRefreshToken());

                verify(userRepository).save(userCaptor.capture());
                User capturedUser = userCaptor.getValue();
                assertEquals("new_user", capturedUser.getUsername());
                assertEquals("newuser@gmail.com", capturedUser.getEmail());
                assertEquals("USER", capturedUser.getRoles());

                verify(oauthAccountRepository).save(oauthCaptor.capture());
                UserOAuthAccount capturedOAuth = oauthCaptor.getValue();
                assertEquals("google", capturedOAuth.getProvider());
                assertEquals("google123", capturedOAuth.getProviderUserId());
                assertEquals(10L, capturedOAuth.getUser().getId());
        }

        @Test
        void loginWithProvider_google_existingOAuth_shouldReturnTokens() {
                OAuthLoginRequest request = new OAuthLoginRequest("google-code", "http://localhost:5173/callback");

                Map<String, Object> tokenResponseBody = Map.of("access_token", "google-access-token");
                Map<String, Object> userInfoBody = Map.of(
                                "sub", "existing-google-id",
                                "email", "existing@gmail.com",
                                "name", "Existing User");

                when(restTemplate.postForEntity(eq("https://oauth2.googleapis.com/token"), any(), eq(Map.class)))
                                .thenReturn(ResponseEntity.ok(tokenResponseBody));
                when(restTemplate.exchange(eq("https://www.googleapis.com/oauth2/v3/userinfo"),
                                eq(HttpMethod.GET), any(), eq(Map.class)))
                                .thenReturn(ResponseEntity.ok(userInfoBody));

                User existingUser = new User();
                existingUser.setId(5L);
                existingUser.setUsername("existing_user");

                UserOAuthAccount existingAccount = new UserOAuthAccount();
                existingAccount.setId(1L);
                existingAccount.setUser(existingUser);
                existingAccount.setProvider("google");
                existingAccount.setProviderUserId("existing-google-id");

                when(oauthAccountRepository.findByProviderAndProviderUserId("google", "existing-google-id"))
                                .thenReturn(Optional.of(existingAccount));

                when(jwtUtil.generateAccessToken(existingUser)).thenReturn("access-token");
                when(jwtUtil.generateRefreshToken(existingUser)).thenReturn("refresh-token");
                when(jwtUtil.extractExpiration("refresh-token"))
                                .thenReturn(new Date(System.currentTimeMillis() + 3600000));

                AuthLoginResponse response = oAuthService.loginWithProvider("google", request);

                assertNotNull(response);
                assertEquals("access-token", response.getAccessToken());
                verify(userRepository, never()).save(any());
                verify(oauthAccountRepository, never()).save(any());
        }

        @Test
        void loginWithProvider_google_existingEmail_shouldLinkAccounts() {
                OAuthLoginRequest request = new OAuthLoginRequest("google-code", "http://localhost:5173/callback");

                Map<String, Object> tokenResponseBody = Map.of("access_token", "google-access-token");
                Map<String, Object> userInfoBody = Map.of(
                                "sub", "google456",
                                "email", "existing@example.com",
                                "name", "Existing User");

                when(restTemplate.postForEntity(eq("https://oauth2.googleapis.com/token"), any(), eq(Map.class)))
                                .thenReturn(ResponseEntity.ok(tokenResponseBody));
                when(restTemplate.exchange(eq("https://www.googleapis.com/oauth2/v3/userinfo"),
                                eq(HttpMethod.GET), any(), eq(Map.class)))
                                .thenReturn(ResponseEntity.ok(userInfoBody));

                when(oauthAccountRepository.findByProviderAndProviderUserId("google", "google456"))
                                .thenReturn(Optional.empty());

                User existingUser = new User();
                existingUser.setId(3L);
                existingUser.setUsername("existing_user");
                when(userRepository.findByEmail("existing@example.com"))
                                .thenReturn(Optional.of(existingUser));
                when(oauthAccountRepository.save(any(UserOAuthAccount.class)))
                                .thenAnswer(i -> i.getArgument(0));

                when(jwtUtil.generateAccessToken(existingUser)).thenReturn("access-token");
                when(jwtUtil.generateRefreshToken(existingUser)).thenReturn("refresh-token");
                when(jwtUtil.extractExpiration("refresh-token"))
                                .thenReturn(new Date(System.currentTimeMillis() + 3600000));

                AuthLoginResponse response = oAuthService.loginWithProvider("google", request);

                assertNotNull(response);
                assertEquals("access-token", response.getAccessToken());
                verify(oauthAccountRepository).save(oauthCaptor.capture());
                assertEquals("google456", oauthCaptor.getValue().getProviderUserId());
                assertEquals(3L, oauthCaptor.getValue().getUser().getId());
        }

        @Test
        void loginWithProvider_shouldThrowForUnsupportedProvider() {
                OAuthLoginRequest request = new OAuthLoginRequest("code", "http://localhost:5173/callback");
                assertThrows(IllegalArgumentException.class,
                                () -> oAuthService.loginWithProvider("facebook", request));
        }
}
