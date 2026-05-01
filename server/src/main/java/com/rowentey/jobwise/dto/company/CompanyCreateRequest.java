package com.rowentey.jobwise.dto.company;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class CompanyCreateRequest {

    @Schema(description = "The name of the company", example = "TikTok")
    @NotBlank(message = "Company name is required")
    private String name;

    @Schema(description = "The website of the company", example = "https://www.tiktok.com")
    private String website;

    @Schema(description = "The industry of the company", example = "Social Media")
    private String industry;

}
