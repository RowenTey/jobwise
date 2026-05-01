package com.rowentey.jobwise.dto.auth;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class OAuthLoginRequest {
    @Schema(description = "Authorization code from the OAuth provider", example = "4/0AeaYSHB...")
    @NotBlank(message = "Code is required")
    private String code;

    @Schema(description = "Redirect URI used in the OAuth request", example = "http://localhost:5173/oauth/callback")
    @NotBlank(message = "Redirect URI is required")
    private String redirectUri;
}
