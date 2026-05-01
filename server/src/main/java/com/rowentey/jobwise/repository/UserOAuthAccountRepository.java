package com.rowentey.jobwise.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.rowentey.jobwise.models.UserOAuthAccount;

@Repository
public interface UserOAuthAccountRepository extends JpaRepository<UserOAuthAccount, Long> {
    Optional<UserOAuthAccount> findByProviderAndProviderUserId(String provider, String providerUserId);

    Optional<UserOAuthAccount> findByProviderAndUserId(String provider, Long userId);
}
