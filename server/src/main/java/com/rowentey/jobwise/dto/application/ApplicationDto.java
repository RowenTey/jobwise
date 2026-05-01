package com.rowentey.jobwise.dto.application;

import java.time.LocalDateTime;

import com.rowentey.jobwise.dto.job.JobDto;
import com.rowentey.jobwise.enums.ApplicationStatus;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ApplicationDto {
    private Long id;
    private String source;
    private String coverLetter;
    private Long userId;
    private JobDto job;
    private ApplicationStatus status;
    private String notes;
    private LocalDateTime lastUpdated;
}
