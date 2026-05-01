package com.rowentey.jobwise.utils;

import static org.junit.jupiter.api.Assertions.*;

import java.util.Date;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import com.rowentey.jobwise.models.User;

class JwtUtilTest {

    private static final String SECRET = "c2VjdXJlU3VwZXJTZWNyZXRLZXlGb3JIUzUxMlRva2VuR2VuZXJhdGlvbjEyMzQ1Njc4OTA=";
    private static final long ACCESS_EXPIRATION = 900000;
    private static final long REFRESH_EXPIRATION = 604800000;

    private JwtUtil jwtUtil;

    @BeforeEach
    void setUp() {
        jwtUtil = new JwtUtil();
        ReflectionTestUtils.setField(jwtUtil, "jwtSecret", SECRET);
        ReflectionTestUtils.setField(jwtUtil, "accessTokenExpirationMs", ACCESS_EXPIRATION);
        ReflectionTestUtils.setField(jwtUtil, "refreshTokenExpirationMs", REFRESH_EXPIRATION);
    }

    private User createUser(Long id, String username) {
        User user = new User();
        user.setId(id);
        user.setUsername(username);
        return user;
    }

    @Test
    void generateAccessToken_shouldReturnToken() {
        User user = createUser(1L, "testuser");
        String token = jwtUtil.generateAccessToken(user);
        assertNotNull(token);
        assertFalse(token.isBlank());
    }

    @Test
    void generateRefreshToken_shouldReturnToken() {
        User user = createUser(1L, "testuser");
        String token = jwtUtil.generateRefreshToken(user);
        assertNotNull(token);
        assertFalse(token.isBlank());
    }

    @Test
    void extractUsername_shouldReturnCorrectUsername() {
        User user = createUser(1L, "testuser");
        String token = jwtUtil.generateAccessToken(user);
        assertEquals("testuser", jwtUtil.extractUsername(token));
    }

    @Test
    void extractUserId_shouldReturnCorrectId() {
        User user = createUser(42L, "testuser");
        String token = jwtUtil.generateAccessToken(user);
        assertEquals(42L, jwtUtil.extractUserId(token));
    }

    @Test
    void extractTokenType_shouldBeAccessForAccessToken() {
        User user = createUser(1L, "testuser");
        String token = jwtUtil.generateAccessToken(user);
        assertEquals("access", jwtUtil.extractTokenType(token));
    }

    @Test
    void extractTokenType_shouldBeRefreshForRefreshToken() {
        User user = createUser(1L, "testuser");
        String token = jwtUtil.generateRefreshToken(user);
        assertEquals("refresh", jwtUtil.extractTokenType(token));
    }

    @Test
    void validateToken_shouldSucceedForValidAccessToken() {
        User user = createUser(1L, "testuser");
        String token = jwtUtil.generateAccessToken(user);
        assertTrue(jwtUtil.validateToken(token, user));
    }

    @Test
    void validateToken_shouldFailForRefreshToken() {
        User user = createUser(1L, "testuser");
        String token = jwtUtil.generateRefreshToken(user);
        assertFalse(jwtUtil.validateToken(token, user));
    }

    @Test
    void validateToken_shouldFailForWrongUser() {
        User user = createUser(1L, "testuser");
        User wrongUser = createUser(2L, "wronguser");
        String token = jwtUtil.generateAccessToken(user);
        assertFalse(jwtUtil.validateToken(token, wrongUser));
    }

    @Test
    void extractExpiration_shouldReturnFutureDate() {
        User user = createUser(1L, "testuser");
        String token = jwtUtil.generateAccessToken(user);
        assertTrue(jwtUtil.extractExpiration(token).after(new Date()));
    }

    @Test
    void generateAccessAndRefreshTokens_shouldHaveDifferentValues() {
        User user = createUser(1L, "testuser");
        String accessToken = jwtUtil.generateAccessToken(user);
        String refreshToken = jwtUtil.generateRefreshToken(user);
        assertNotEquals(accessToken, refreshToken);
    }
}
