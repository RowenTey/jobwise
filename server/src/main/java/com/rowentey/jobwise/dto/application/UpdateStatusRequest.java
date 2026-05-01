package com.rowentey.jobwise.dto.application;

import com.rowentey.jobwise.enums.ApplicationStatus;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class UpdateStatusRequest {

    @Schema(description = "New status for the application", example = "Interview")
    @NotNull(message = "Status is required")
    private ApplicationStatus status;
}
