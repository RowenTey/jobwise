package com.rowentey.jobwise.services;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.rowentey.jobwise.dto.auth.ApiKeyResponse;
import com.rowentey.jobwise.dto.auth.CreateApiKeyRequest;
import com.rowentey.jobwise.exceptions.InvalidApiKeyException;
import com.rowentey.jobwise.mapper.ApiKeyMapper;
import com.rowentey.jobwise.models.ApiKey;
import com.rowentey.jobwise.models.User;
import com.rowentey.jobwise.repository.ApiKeyRepository;

import jakarta.persistence.EntityNotFoundException;

@ExtendWith(MockitoExtension.class)
class ApiKeyServiceTest {

    @Mock
    private ApiKeyRepository apiKeyRepository;

    @Mock
    private ApiKeyMapper apiKeyMapper;

    @InjectMocks
    private ApiKeyService apiKeyService;

    private User user() {
        User user = new User();
        user.setId(1L);
        user.setUsername("testuser");
        return user;
    }

    private ApiKey apiKeyEntity(User user, String hash) {
        ApiKey key = new ApiKey();
        key.setId(1L);
        key.setUser(user);
        key.setKeyHash(hash);
        key.setName("Chrome Extension");
        return key;
    }

    @Test
    void createKey_shouldReturnResponseWithRawKey() {
        User user = user();
        CreateApiKeyRequest request = new CreateApiKeyRequest("Chrome Extension");

        when(apiKeyRepository.save(any(ApiKey.class))).thenAnswer(i -> {
            ApiKey saved = i.getArgument(0);
            saved.setId(1L);
            return saved;
        });
        when(apiKeyMapper.toDto(any(ApiKey.class)))
                .thenReturn(new ApiKeyResponse(1L, "Chrome Extension", null,
                        java.time.LocalDateTime.now(), null, false));

        ApiKeyResponse response = apiKeyService.createKey(user, request);

        assertNotNull(response);
        assertEquals("Chrome Extension", response.getName());
        assertTrue(response.getRawKey().startsWith("jw_"));
        assertEquals(46, response.getRawKey().length());
        assertFalse(response.isRevoked());
        verify(apiKeyRepository).save(any(ApiKey.class));
        verify(apiKeyMapper).toDto(any(ApiKey.class));
    }

    @Test
    void validateKey_shouldReturnUser() {
        User user = user();
        String rawKey = "jw_testRawKey1234567890ABCDEFGH";
        String hash = apiKeyService.hashKey(rawKey);
        ApiKey apiKey = apiKeyEntity(user, hash);

        when(apiKeyRepository.findByKeyHash(hash)).thenReturn(Optional.of(apiKey));
        when(apiKeyRepository.save(any(ApiKey.class))).thenReturn(apiKey);

        User result = apiKeyService.validateKey(rawKey);

        assertNotNull(result);
        assertEquals(1L, result.getId());
        verify(apiKeyRepository).findByKeyHash(hash);
    }

    @Test
    void validateKey_shouldThrowForInvalidKey() {
        String rawKey = "jw_invalidKey";
        String hash = apiKeyService.hashKey(rawKey);

        when(apiKeyRepository.findByKeyHash(hash)).thenReturn(Optional.empty());

        assertThrows(InvalidApiKeyException.class, () -> apiKeyService.validateKey(rawKey));
    }

    @Test
    void validateKey_shouldThrowForRevokedKey() {
        User user = user();
        String rawKey = "jw_revokedKey1234567890ABCDEFGH";
        String hash = apiKeyService.hashKey(rawKey);
        ApiKey apiKey = apiKeyEntity(user, hash);
        apiKey.setRevokedAt(java.time.LocalDateTime.now());

        when(apiKeyRepository.findByKeyHash(hash)).thenReturn(Optional.of(apiKey));

        assertThrows(InvalidApiKeyException.class, () -> apiKeyService.validateKey(rawKey));
    }

    @Test
    void listKeys_shouldReturnActiveKeys() {
        User user = user();
        ApiKey key1 = apiKeyEntity(user, "hash1");
        key1.setName("Key 1");
        ApiKey key2 = apiKeyEntity(user, "hash2");
        key2.setName("Key 2");

        when(apiKeyRepository.findByUserAndRevokedAtIsNull(user)).thenReturn(List.of(key1, key2));
        when(apiKeyMapper.toDto(key1))
                .thenReturn(new ApiKeyResponse(1L, "Key 1", null, null, null, false));
        when(apiKeyMapper.toDto(key2))
                .thenReturn(new ApiKeyResponse(2L, "Key 2", null, null, null, false));

        List<ApiKeyResponse> keys = apiKeyService.listKeys(user);

        assertEquals(2, keys.size());
        verify(apiKeyRepository).findByUserAndRevokedAtIsNull(user);
    }

    @Test
    void revokeKey_shouldSetRevokedAt() {
        User user = user();
        ApiKey apiKey = apiKeyEntity(user, "hash");

        when(apiKeyRepository.findByIdAndUser(1L, user)).thenReturn(Optional.of(apiKey));

        apiKeyService.revokeKey(1L, user);

        assertNotNull(apiKey.getRevokedAt());
        verify(apiKeyRepository).save(apiKey);
    }

    @Test
    void revokeKey_shouldThrowForNonExistentKey() {
        User user = user();
        when(apiKeyRepository.findByIdAndUser(99L, user)).thenReturn(Optional.empty());

        assertThrows(EntityNotFoundException.class, () -> apiKeyService.revokeKey(99L, user));
    }

    @Test
    void hashKey_shouldReturnConsistentHash() {
        String rawKey = "jw_testKey";
        String hash1 = apiKeyService.hashKey(rawKey);
        String hash2 = apiKeyService.hashKey(rawKey);
        assertEquals(hash1, hash2);
        assertFalse(hash1.isBlank());
    }

    @Test
    void hashKey_shouldReturnDifferentHashForDifferentKeys() {
        String hash1 = apiKeyService.hashKey("jw_key1");
        String hash2 = apiKeyService.hashKey("jw_key2");
        assertNotEquals(hash1, hash2);
    }
}
