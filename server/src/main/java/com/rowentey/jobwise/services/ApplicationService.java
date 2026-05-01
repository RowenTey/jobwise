package com.rowentey.jobwise.services;

import java.time.LocalDate;
import java.time.LocalDateTime;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import com.rowentey.jobwise.dto.application.ApplicationCreateRequest;
import com.rowentey.jobwise.dto.application.ApplicationDto;
import com.rowentey.jobwise.enums.ApplicationStatus;
import com.rowentey.jobwise.exceptions.ForbiddenException;
import com.rowentey.jobwise.mapper.ApplicationMapper;
import com.rowentey.jobwise.models.Application;
import com.rowentey.jobwise.models.Company;
import com.rowentey.jobwise.models.Job;
import com.rowentey.jobwise.models.User;
import com.rowentey.jobwise.repository.ApplicationRepository;
import com.rowentey.jobwise.repository.ApplicationSpecification;

import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ApplicationService {

    private final CompanyService companyService;
    private final JobService jobService;
    private final ApplicationRepository applicationRepository;
    private final ApplicationMapper applicationMapper;

    public Page<ApplicationDto> getApplications(
            User user,
            String status,
            Long jobId,
            Long companyId,
            String fromDate,
            String toDate,
            int page,
            int size,
            String sort,
            String direction) {
        ApplicationStatus parsedStatus = status != null ? ApplicationStatus.fromString(status) : null;
        if (status != null && parsedStatus == null) {
            throw new IllegalArgumentException("Invalid status value");
        }

        LocalDateTime parsedFromDate = fromDate != null ? LocalDate.parse(fromDate).atStartOfDay() : null;
        LocalDateTime parsedToDate = toDate != null ? LocalDate.parse(toDate).plusDays(1).atStartOfDay().minusNanos(1)
                : null;

        Sort sortBy = Sort.by(Sort.Direction.fromString(direction), sort);
        Pageable pageable = PageRequest.of(page, size, sortBy);

        Specification<Application> spec = ApplicationSpecification.withFilters(
                user,
                parsedStatus,
                jobId,
                companyId,
                parsedFromDate,
                parsedToDate);

        return applicationRepository.findAll(spec, pageable)
                .map(applicationMapper::toDto);
    }

    @Transactional
    public Long createApplication(
            User user, ApplicationCreateRequest request) {
        Company company = companyService.createCompany(request.getCompany());
        Job job = jobService.createJob(request.getJob(), company);
        Application application = applicationMapper.toEntity(request, user, job);
        return applicationRepository.save(application).getId();
    }

    @Transactional
    public ApplicationDto updateStatus(User user, Long id, ApplicationStatus status) {
        Application application = applicationRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Application with ID " + id + " not found"));

        if (!application.getUser().getId().equals(user.getId())) {
            throw new ForbiddenException("Application does not belong to the current user");
        }

        application.setStatus(status);
        return applicationMapper.toDto(applicationRepository.save(application));
    }
}
