package com.rowentey.jobwise.services;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import com.rowentey.jobwise.dto.job.JobCreateRequest;
import com.rowentey.jobwise.dto.job.JobDto;
import com.rowentey.jobwise.mapper.JobMapper;
import com.rowentey.jobwise.models.Company;
import com.rowentey.jobwise.models.Job;
import com.rowentey.jobwise.repository.JobRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class JobService {

    private final JobRepository jobRepository;
    private final JobMapper jobMapper;

    public Page<JobDto> getJobs(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return jobRepository.findAll(pageable).map(jobMapper::toDto);
    }

    public Job createJob(JobCreateRequest request, Company company) {
        try {
            Job job = jobMapper.toEntity(request, company);
            return jobRepository.save(job);
        } catch (Exception e) {
            log.error("Error creating job: {}", e.getMessage());
            throw e;
        }
    }
}
