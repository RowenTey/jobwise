package com.rowentey.jobwise.dto.auth;

import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonInclude;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiKeyResponse {
    private final Long id;
    private final String name;
    private final String rawKey;
    private final LocalDateTime createdAt;
    private final LocalDateTime lastUsedAt;
    private final boolean revoked;
}
