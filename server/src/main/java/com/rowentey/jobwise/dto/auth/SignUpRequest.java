package com.rowentey.jobwise.dto.auth;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class SignUpRequest {
    @Schema(description = "Username for the new user", example = "john_doe")
    @NotBlank(message = "Username is required")
    private String username;

    @Schema(description = "Email address for the new user", example = "john.doe@gmail.com")
    @NotBlank(message = "Email is required")
    @Email(message = "Email must be valid")
    private String email;

    @Schema(description = "Password for the new user", example = "P@ssw0rd!")
    @NotBlank(message = "Password is required")
    private String password;
}
