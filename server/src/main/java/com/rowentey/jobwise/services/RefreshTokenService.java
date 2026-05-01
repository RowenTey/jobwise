package com.rowentey.jobwise.services;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Date;
import java.util.HexFormat;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.rowentey.jobwise.exceptions.AuthExceptions.InvalidRefreshTokenException;
import com.rowentey.jobwise.mapper.RefreshTokenMapper;
import com.rowentey.jobwise.models.RefreshToken;
import com.rowentey.jobwise.models.User;
import com.rowentey.jobwise.repository.RefreshTokenRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class RefreshTokenService {

    private final RefreshTokenRepository refreshTokenRepository;
    private final RefreshTokenMapper refreshTokenMapper;

    public String hashToken(String rawToken) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(rawToken.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException("SHA-256 algorithm not available", ex);
        }
    }

    @Transactional
    public RefreshToken createToken(User user, String rawToken, Date expiresAt) {
        RefreshToken refreshToken = refreshTokenMapper.toEntity(user, hashToken(rawToken), expiresAt, new Date());
        return refreshTokenRepository.save(refreshToken);
    }

    @Transactional
    public void revokeToken(String rawToken) throws InvalidRefreshTokenException {
        String tokenHash = hashToken(rawToken);
        RefreshToken refreshToken = refreshTokenRepository.findByTokenHash(tokenHash)
                .orElseThrow(() -> new InvalidRefreshTokenException("Refresh token is invalid"));

        if (refreshToken.isRevoked()) {
            return;
        }

        refreshToken.setRevokedAt(new Date());
        refreshTokenRepository.save(refreshToken);
    }

    @Transactional
    public void revokeAllUserTokens(Long userId) {
        List<RefreshToken> activeTokens = refreshTokenRepository.findByUserIdAndRevokedAtIsNull(userId);
        Date now = new Date();
        for (RefreshToken token : activeTokens) {
            token.setRevokedAt(now);
        }
        refreshTokenRepository.saveAll(activeTokens);
    }

    public User validateTokenAndGetUser(String rawToken) throws InvalidRefreshTokenException {
        String tokenHash = hashToken(rawToken);
        RefreshToken refreshToken = refreshTokenRepository.findByTokenHash(tokenHash)
                .orElseThrow(() -> new InvalidRefreshTokenException("Refresh token is invalid"));

        if (refreshToken.isRevoked()) {
            throw new InvalidRefreshTokenException("Refresh token has been revoked");
        }

        if (refreshToken.isExpired()) {
            throw new InvalidRefreshTokenException("Refresh token has expired");
        }

        return refreshToken.getUser();
    }
}
