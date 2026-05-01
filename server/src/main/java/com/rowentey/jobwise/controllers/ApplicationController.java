package com.rowentey.jobwise.controllers;

import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.rowentey.jobwise.dto.application.ApplicationCreateRequest;
import com.rowentey.jobwise.dto.application.ApplicationDto;
import com.rowentey.jobwise.dto.application.UpdateStatusRequest;
import com.rowentey.jobwise.models.User;
import com.rowentey.jobwise.services.ApplicationService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("api/v1/applications")
@RequiredArgsConstructor
@Tag(name = "Applications", description = "Job Application APIs")
public class ApplicationController {
        private final ApplicationService applicationService;

        @Operation(summary = "Get applications for user with optional filters")
        @ApiResponses(value = { @ApiResponse(responseCode = "200", description = "Successful operation", content = {
                        @Content(mediaType = "application/json", schema = @Schema(implementation = ApplicationDto.class)) }) })
        @GetMapping
        public ResponseEntity<Page<ApplicationDto>> getApplications(
                        @RequestParam(required = false) String status,
                        @RequestParam(required = false) Long jobId,
                        @RequestParam(required = false) Long companyId,
                        @RequestParam(required = false) String fromDate,
                        @RequestParam(required = false) String toDate,
                        @RequestParam(defaultValue = "0") int page,
                        @RequestParam(defaultValue = "20") int size,
                        @RequestParam(defaultValue = "lastUpdated") String sort,
                        @RequestParam(defaultValue = "desc") String direction,
                        @AuthenticationPrincipal User user) {
                return ResponseEntity.ok(applicationService.getApplications(user, status,
                                jobId, companyId, fromDate, toDate, page, size, sort, direction));
        }

        @Operation(summary = "Create a new application")
        @ApiResponses(value = {
                        @ApiResponse(responseCode = "201", description = "Application created successfully", content = {
                                        @Content(mediaType = "application/json", schema = @Schema(implementation = Long.class)) }) })
        @PostMapping
        public ResponseEntity<Long> createApplication(
                        @Valid @RequestBody ApplicationCreateRequest request,
                        @AuthenticationPrincipal User user) {
                return new ResponseEntity<>(
                                applicationService.createApplication(user, request),
                                HttpStatus.CREATED);
        }

        @Operation(summary = "Update application status")
        @ApiResponses(value = {
                        @ApiResponse(responseCode = "200", description = "Application status updated successfully"),
                        @ApiResponse(responseCode = "404", description = "Application not found"),
                        @ApiResponse(responseCode = "403", description = "Application does not belong to the current user") })
        @PatchMapping("/{id}/status")
        public ResponseEntity<ApplicationDto> updateStatus(
                        @PathVariable Long id,
                        @Valid @RequestBody UpdateStatusRequest request,
                        @AuthenticationPrincipal User user) {
                return ResponseEntity.ok(
                                applicationService.updateStatus(user, id, request.getStatus()));
        }
}
