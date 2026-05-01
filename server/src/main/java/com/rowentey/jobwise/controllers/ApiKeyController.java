package com.rowentey.jobwise.controllers;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.rowentey.jobwise.dto.auth.ApiKeyResponse;
import com.rowentey.jobwise.dto.auth.CreateApiKeyRequest;
import com.rowentey.jobwise.models.User;
import com.rowentey.jobwise.services.ApiKeyService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("api/v1/auth/api-keys")
@RequiredArgsConstructor
@Tag(name = "API Keys", description = "API Key APIs")
public class ApiKeyController {

    private final ApiKeyService apiKeyService;

    @Operation(summary = "Create a new API key")
    @PostMapping
    public ResponseEntity<ApiKeyResponse> createKey(
            @Valid @RequestBody CreateApiKeyRequest request,
            @AuthenticationPrincipal User user) {
        return new ResponseEntity<>(apiKeyService.createKey(user, request), HttpStatus.CREATED);
    }

    @Operation(summary = "List all active API keys")
    @GetMapping
    public ResponseEntity<List<ApiKeyResponse>> listKeys(
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(apiKeyService.listKeys(user));
    }

    @Operation(summary = "Revoke an API key")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> revokeKey(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        apiKeyService.revokeKey(id, user);
        return ResponseEntity.noContent().build();
    }
}
