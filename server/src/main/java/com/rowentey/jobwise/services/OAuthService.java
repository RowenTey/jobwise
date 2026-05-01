package com.rowentey.jobwise.services;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import com.rowentey.jobwise.dto.auth.AuthLoginResponse;
import com.rowentey.jobwise.dto.auth.OAuthLoginRequest;
import com.rowentey.jobwise.models.User;
import com.rowentey.jobwise.models.UserOAuthAccount;
import com.rowentey.jobwise.repository.UserOAuthAccountRepository;
import com.rowentey.jobwise.repository.UserRepository;
import com.rowentey.jobwise.utils.JwtUtil;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class OAuthService {

    private final JwtUtil jwtUtil;
    private final PasswordEncoder passwordEncoder;
    private final UserRepository userRepository;
    private final UserOAuthAccountRepository oauthAccountRepository;
    private final RefreshTokenService refreshTokenService;
    private final RestTemplateBuilder restTemplateBuilder;

    @Value("${oauth.google.client-id:}")
    private String googleClientId;

    @Value("${oauth.google.client-secret:}")
    private String googleClientSecret;

    @Value("${oauth.github.client-id:}")
    private String githubClientId;

    @Value("${oauth.github.client-secret:}")
    private String githubClientSecret;

    @Transactional
    public AuthLoginResponse loginWithProvider(String provider, OAuthLoginRequest request) {
        String email;
        String providerUserId;
        String name;

        switch (provider.toLowerCase()) {
            case "google" -> {
                Map<String, Object> userInfo = exchangeGoogleCode(request.getCode(), request.getRedirectUri());
                email = (String) userInfo.get("email");
                providerUserId = (String) userInfo.get("sub");
                name = (String) userInfo.get("name");
            }
            case "github" -> {
                Map<String, Object> userInfo = exchangeGitHubCode(request.getCode(), request.getRedirectUri());
                email = (String) userInfo.get("email");
                providerUserId = userInfo.get("id").toString();
                name = (String) userInfo.get("login");
            }
            default -> throw new IllegalArgumentException("Unsupported OAuth provider: " + provider);
        }

        User user = resolveUser(provider, providerUserId, email, name);

        String accessToken = jwtUtil.generateAccessToken(user);
        String refreshToken = jwtUtil.generateRefreshToken(user);
        refreshTokenService.createToken(user, refreshToken, jwtUtil.extractExpiration(refreshToken));

        return new AuthLoginResponse(accessToken, refreshToken);
    }

    private User resolveUser(String provider, String providerUserId, String email, String name) {
        Optional<UserOAuthAccount> existingOAuth = oauthAccountRepository
                .findByProviderAndProviderUserId(provider, providerUserId);
        if (existingOAuth.isPresent()) {
            return existingOAuth.get().getUser();
        }

        if (email != null && !email.isBlank()) {
            Optional<User> existingUser = userRepository.findByEmail(email);
            if (existingUser.isPresent()) {
                UserOAuthAccount account = new UserOAuthAccount();
                account.setUser(existingUser.get());
                account.setProvider(provider);
                account.setProviderUserId(providerUserId);
                oauthAccountRepository.save(account);
                return existingUser.get();
            }
        }

        User newUser = new User();
        String username = generateUniqueUsername(name, email);
        newUser.setUsername(username);
        newUser.setEmail(email != null && !email.isBlank() ? email : providerUserId + "@" + provider + ".oauth");
        newUser.setPassword(passwordEncoder.encode(UUID.randomUUID().toString()));
        newUser.setRoles("USER");
        newUser = userRepository.save(newUser);

        UserOAuthAccount account = new UserOAuthAccount();
        account.setUser(newUser);
        account.setProvider(provider);
        account.setProviderUserId(providerUserId);
        oauthAccountRepository.save(account);

        return newUser;
    }

    private String generateUniqueUsername(String name, String email) {
        String base = "user";
        if (name != null && !name.isBlank()) {
            base = name.replaceAll("\\s+", "_").toLowerCase();
        } else if (email != null && !email.isBlank()) {
            base = email.split("@")[0].toLowerCase();
        }

        // TODO: Refactor this to be more efficient
        String username = base;
        int suffix = 1;
        while (userRepository.findByUsername(username).isPresent()) {
            username = base + "_" + suffix;
            suffix++;
        }
        return username;
    }

    private Map<String, Object> exchangeGoogleCode(String code, String redirectUri) {
        RestTemplate restTemplate = restTemplateBuilder.build();

        MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
        body.add("code", code);
        body.add("client_id", googleClientId);
        body.add("client_secret", googleClientSecret);
        body.add("redirect_uri", redirectUri);
        body.add("grant_type", "authorization_code");

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        ResponseEntity<Map> tokenResponse = restTemplate.postForEntity(
                "https://oauth2.googleapis.com/token",
                new HttpEntity<>(body, headers),
                Map.class);

        String accessToken = (String) tokenResponse.getBody().get("access_token");

        HttpHeaders userHeaders = new HttpHeaders();
        userHeaders.setBearerAuth(accessToken);
        HttpEntity<?> userEntity = new HttpEntity<>(userHeaders);

        ResponseEntity<Map> userResponse = restTemplate.exchange(
                "https://www.googleapis.com/oauth2/v3/userinfo",
                HttpMethod.GET,
                userEntity,
                Map.class);

        Map<String, Object> userInfo = userResponse.getBody();
        if (userInfo == null || userInfo.get("sub") == null) {
            throw new IllegalArgumentException("Failed to fetch user info from Google");
        }
        return userInfo;
    }

    private Map<String, Object> exchangeGitHubCode(String code, String redirectUri) {
        RestTemplate restTemplate = restTemplateBuilder.build();

        MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
        body.add("code", code);
        body.add("client_id", githubClientId);
        body.add("client_secret", githubClientSecret);
        body.add("redirect_uri", redirectUri);

        HttpHeaders tokenHeaders = new HttpHeaders();
        tokenHeaders.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
        tokenHeaders.setAccept(java.util.List.of(MediaType.APPLICATION_JSON));

        ResponseEntity<Map> tokenResponse = restTemplate.postForEntity(
                "https://github.com/login/oauth/access_token",
                new HttpEntity<>(body, tokenHeaders),
                Map.class);

        String accessToken = (String) tokenResponse.getBody().get("access_token");

        if (accessToken == null) {
            throw new IllegalArgumentException("Failed to exchange GitHub authorization code");
        }

        HttpHeaders userHeaders = new HttpHeaders();
        userHeaders.setBearerAuth(accessToken);
        userHeaders.setAccept(List.of(MediaType.APPLICATION_JSON));
        HttpEntity<?> userEntity = new HttpEntity<>(userHeaders);

        ResponseEntity<Map> userResponse = restTemplate.exchange(
                "https://api.github.com/user",
                HttpMethod.GET,
                userEntity,
                Map.class);

        Map<String, Object> userInfo = userResponse.getBody();
        if (userInfo == null || userInfo.get("id") == null) {
            throw new IllegalArgumentException("Failed to fetch user info from GitHub");
        }

        if (userInfo.get("email") == null) {
            ResponseEntity<Map[]> emailsResponse = restTemplate.exchange(
                    "https://api.github.com/user/emails",
                    HttpMethod.GET,
                    userEntity,
                    Map[].class);
            for (Map<String, Object> emailEntry : emailsResponse.getBody()) {
                if (Boolean.TRUE.equals(emailEntry.get("primary")) && Boolean.TRUE.equals(emailEntry.get("verified"))) {
                    userInfo.put("email", emailEntry.get("email"));
                    break;
                }
            }
        }

        return userInfo;
    }
}
