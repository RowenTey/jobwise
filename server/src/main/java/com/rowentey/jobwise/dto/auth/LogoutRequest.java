package com.rowentey.jobwise.dto.auth;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class LogoutRequest {
    @Schema(description = "The refresh token to invalidate", example = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...")
    private String refreshToken;

    @Schema(description = "Whether to log out from all devices (invalidate all refresh tokens)", example = "false")
    private boolean logoutAllDevices;
}
