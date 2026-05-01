package com.rowentey.jobwise.services;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.rowentey.jobwise.dto.auth.ApiKeyResponse;
import com.rowentey.jobwise.dto.auth.CreateApiKeyRequest;
import com.rowentey.jobwise.exceptions.InvalidApiKeyException;
import com.rowentey.jobwise.mapper.ApiKeyMapper;
import com.rowentey.jobwise.models.ApiKey;
import com.rowentey.jobwise.models.User;
import com.rowentey.jobwise.repository.ApiKeyRepository;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ApiKeyService {

    private static final String KEY_PREFIX = "jw_";
    private static final int KEY_BYTES = 32;
    private final ApiKeyRepository apiKeyRepository;
    private final ApiKeyMapper apiKeyMapper;

    public String hashKey(String rawKey) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(rawKey.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                hexString.append(String.format("%02x", b));
            }
            return hexString.toString();
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException("SHA-256 algorithm not available", ex);
        }
    }

    private String generateRawKey() {
        SecureRandom random = new SecureRandom();
        byte[] bytes = new byte[KEY_BYTES];
        random.nextBytes(bytes);
        return KEY_PREFIX + Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    @Transactional
    public ApiKeyResponse createKey(User user, CreateApiKeyRequest request) {
        String rawKey = generateRawKey();
        String keyHash = hashKey(rawKey);

        ApiKey apiKey = new ApiKey();
        apiKey.setUser(user);
        apiKey.setKeyHash(keyHash);
        apiKey.setName(request.getName());
        apiKey = apiKeyRepository.save(apiKey);

        ApiKeyResponse base = apiKeyMapper.toDto(apiKey);
        return new ApiKeyResponse(base.getId(), base.getName(), rawKey,
                base.getCreatedAt(), null, false);
    }

    public List<ApiKeyResponse> listKeys(User user) {
        return apiKeyRepository.findByUserAndRevokedAtIsNull(user).stream()
                .map(apiKeyMapper::toDto)
                .toList();
    }

    @Transactional
    public void revokeKey(Long keyId, User user) {
        ApiKey apiKey = apiKeyRepository.findByIdAndUser(keyId, user)
                .orElseThrow(() -> new EntityNotFoundException("API key not found"));
        apiKey.setRevokedAt(LocalDateTime.now());
        apiKeyRepository.save(apiKey);
    }

    public User validateKey(String rawKey) {
        String hash = hashKey(rawKey);
        ApiKey apiKey = apiKeyRepository.findByKeyHash(hash)
                .orElseThrow(() -> new InvalidApiKeyException("Invalid API key"));

        if (apiKey.isRevoked()) {
            throw new InvalidApiKeyException("API key has been revoked");
        }

        apiKey.setLastUsedAt(LocalDateTime.now());
        apiKeyRepository.save(apiKey);

        return apiKey.getUser();
    }
}
