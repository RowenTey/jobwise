package com.rowentey.jobwise.controllers;

import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.rowentey.jobwise.dto.company.CompanyDto;
import com.rowentey.jobwise.services.CompanyService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("api/v1/companies")
@RequiredArgsConstructor
@Tag(name = "Companies", description = "Company APIs")
public class CompanyController {

    private final CompanyService companyService;

    @Operation(summary = "Get companies with optional filters")
    @ApiResponses(value = { @ApiResponse(responseCode = "200", description = "Successful operation", content = {
            @Content(mediaType = "application/json", schema = @Schema(implementation = CompanyDto.class)) }) })
    @GetMapping
    public ResponseEntity<Page<CompanyDto>> getCompanies(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(companyService.getCompanies(page, size));
    }
}
