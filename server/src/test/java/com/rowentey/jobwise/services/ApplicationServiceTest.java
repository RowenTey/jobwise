package com.rowentey.jobwise.services;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.rowentey.jobwise.dto.application.ApplicationCreateRequest;
import com.rowentey.jobwise.dto.application.ApplicationDto;
import com.rowentey.jobwise.dto.company.CompanyCreateRequest;
import com.rowentey.jobwise.dto.job.JobCreateRequest;
import com.rowentey.jobwise.enums.ApplicationStatus;
import com.rowentey.jobwise.exceptions.ForbiddenException;
import com.rowentey.jobwise.mapper.ApplicationMapper;
import com.rowentey.jobwise.models.Application;
import com.rowentey.jobwise.models.Company;
import com.rowentey.jobwise.models.Job;
import com.rowentey.jobwise.models.User;
import com.rowentey.jobwise.repository.ApplicationRepository;

import jakarta.persistence.EntityNotFoundException;

@ExtendWith(MockitoExtension.class)
class ApplicationServiceTest {

    @Mock
    private CompanyService companyService;
    @Mock
    private JobService jobService;
    @Mock
    private ApplicationRepository applicationRepository;
    @Mock
    private ApplicationMapper applicationMapper;

    @InjectMocks
    private ApplicationService applicationService;

    private User user(Long id) {
        User user = new User();
        user.setId(id);
        user.setUsername("user" + id);
        return user;
    }

    private Application application(Long id, User owner) {
        Application app = new Application();
        app.setId(id);
        app.setUser(owner);
        app.setStatus(ApplicationStatus.APPLIED);
        return app;
    }

    @Test
    void createApplication_shouldReturnNewId() {
        User user = user(1L);
        ApplicationCreateRequest request = new ApplicationCreateRequest();
        request.setSource("LinkedIn");
        request.setCompany(new CompanyCreateRequest());
        request.setJob(new JobCreateRequest());

        Company company = new Company();
        Job job = new Job();
        Application application = new Application();
        application.setId(99L);

        when(companyService.createCompany(any())).thenReturn(company);
        when(jobService.createJob(any(), any())).thenReturn(job);
        when(applicationMapper.toEntity(any(), any(), any())).thenReturn(application);
        when(applicationRepository.save(application)).thenReturn(application);

        Long result = applicationService.createApplication(user, request);

        assertEquals(99L, result);
        verify(companyService).createCompany(request.getCompany());
        verify(jobService).createJob(request.getJob(), company);
        verify(applicationRepository).save(application);
    }

    @Test
    void updateStatus_shouldSucceed() {
        User user = user(1L);
        Application application = application(5L, user);

        when(applicationRepository.findById(5L)).thenReturn(Optional.of(application));
        when(applicationRepository.save(application)).thenReturn(application);

        ApplicationDto expectedDto = new ApplicationDto();
        expectedDto.setStatus(ApplicationStatus.INTERVIEW);
        when(applicationMapper.toDto(application)).thenReturn(expectedDto);

        ApplicationDto result = applicationService.updateStatus(user, 5L, ApplicationStatus.INTERVIEW);

        assertEquals(ApplicationStatus.INTERVIEW, result.getStatus());
        assertEquals(ApplicationStatus.INTERVIEW, application.getStatus());
        verify(applicationRepository).save(application);
    }

    @Test
    void updateStatus_shouldThrowEntityNotFoundException() {
        User user = user(1L);
        when(applicationRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(EntityNotFoundException.class,
                () -> applicationService.updateStatus(user, 99L, ApplicationStatus.REJECTED));
        verify(applicationRepository, never()).save(any());
    }

    @Test
    void updateStatus_shouldThrowForbiddenExceptionWhenNotOwner() {
        User owner = user(1L);
        User otherUser = user(2L);
        Application application = application(5L, owner);

        when(applicationRepository.findById(5L)).thenReturn(Optional.of(application));

        assertThrows(ForbiddenException.class,
                () -> applicationService.updateStatus(otherUser, 5L, ApplicationStatus.INTERVIEW));
        verify(applicationRepository, never()).save(any());
    }
}
