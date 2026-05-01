package com.rowentey.jobwise.dto.job;

import com.rowentey.jobwise.enums.JobType;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class JobCreateRequest {

    @Schema(description = "The title of the job", example = "Software Engineer")
    @NotBlank(message = "Job title is required")
    private String title;

    @Schema(description = "The description of the job", example = "We are looking for a skilled software engineer to join our team.")
    @NotBlank(message = "Job description is required")
    private String description;

    @Schema(description = "The location of the job", example = "New York, NY")
    private String location;

    @Schema(description = "The type of the job", example = "FULL_TIME")
    @NotBlank(message = "Job type is required")
    private JobType jobType;

    @Schema(description = "The external URL for the job posting", example = "https://www.tiktok.com/careers/software-engineer")
    @NotBlank(message = "External URL is required")
    private String externalUrl;

    @Schema(description = "The minimum salary for the job", example = "60000")
    private Integer salaryMin;

    @Schema(description = "The maximum salary for the job", example = "120000")
    private Integer salaryMax;

}
