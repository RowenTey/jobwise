package com.rowentey.jobwise.dto.auth;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class CreateApiKeyRequest {
    @Schema(description = "A name to identify this API key", example = "Chrome Extension")
    @NotBlank(message = "Name is required")
    private String name;
}
