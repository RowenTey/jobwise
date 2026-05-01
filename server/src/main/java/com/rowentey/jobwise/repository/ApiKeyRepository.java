package com.rowentey.jobwise.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.rowentey.jobwise.models.ApiKey;
import com.rowentey.jobwise.models.User;

@Repository
public interface ApiKeyRepository extends JpaRepository<ApiKey, Long> {
    Optional<ApiKey> findByKeyHash(String keyHash);

    List<ApiKey> findByUserAndRevokedAtIsNull(User user);

    Optional<ApiKey> findByIdAndUser(Long id, User user);
}
