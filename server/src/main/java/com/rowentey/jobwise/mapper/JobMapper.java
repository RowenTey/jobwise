package com.rowentey.jobwise.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import com.rowentey.jobwise.dto.job.JobCreateRequest;
import com.rowentey.jobwise.dto.job.JobDto;
import com.rowentey.jobwise.models.Company;
import com.rowentey.jobwise.models.Job;

@Mapper(componentModel = "spring")
public interface JobMapper {

        @Mapping(target = "id", ignore = true)
        @Mapping(target = "createdAt", ignore = true)
        @Mapping(target = "updatedAt", ignore = true)
        @Mapping(target = "company", source = "company")
        Job toEntity(JobCreateRequest request, Company company);

        JobDto toDto(Job job);
}
