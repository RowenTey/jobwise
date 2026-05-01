package com.rowentey.jobwise.dto.job;

import com.rowentey.jobwise.dto.company.CompanyDto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class JobDto {
    private Long id;
    private String title;
    private String description;
    private String location;
    private String jobType;
    private String externalUrl;
    private Integer salaryMin;
    private Integer salaryMax;
    private CompanyDto company;
}
