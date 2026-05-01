package com.rowentey.jobwise.dto.application;

import com.rowentey.jobwise.dto.company.CompanyCreateRequest;
import com.rowentey.jobwise.dto.job.JobCreateRequest;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ApplicationCreateRequest {

    @Schema(description = "The source of the application", example = "LinkedIn")
    @NotNull(message = "Source is required")
    private String source;

    @Schema(description = "The cover letter content for the application")
    private String coverLetter;

    @NotNull(message = "Company is required")
    private CompanyCreateRequest company;

    @NotNull(message = "Job is required")
    private JobCreateRequest job;

    @Schema(description = "Additional notes about the application", example = "Had a great conversation with the recruiter.")
    private String notes;
}
