package com.rowentey.jobwise.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import com.rowentey.jobwise.dto.application.ApplicationCreateRequest;
import com.rowentey.jobwise.dto.application.ApplicationDto;
import com.rowentey.jobwise.models.Application;
import com.rowentey.jobwise.models.Job;
import com.rowentey.jobwise.models.User;

@Mapper(componentModel = "spring")
public interface ApplicationMapper {

    @Mapping(target = "userId", source = "application.user.id")
    ApplicationDto toDto(Application application);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "status", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "lastUpdated", ignore = true)
    @Mapping(target = "user", source = "user")
    @Mapping(target = "job", source = "job")
    Application toEntity(ApplicationCreateRequest request, User user, Job job);

    // @Mapping(target = "id", ignore = true)
    // @Mapping(target = "applicationUrl", source =
    // "incomingApplication.applicationUrl")
    // @Mapping(target = "companyName", source = "incomingApplication.companyName")
    // @Mapping(target = "companyUrl", source = "incomingApplication.companyUrl")
    // @Mapping(target = "jobTitle", source = "incomingApplication.jobTitle")
    // @Mapping(target = "jobDescription", source =
    // "incomingApplication.jobDescription")
    // @Mapping(target = "source", source = "incomingApplication.source")
    // @Mapping(target = "remark", source = "incomingApplication.remark")
    // @Mapping(target = "coverLetter", source = "incomingApplication.coverLetter")
    // @Mapping(target = "status", source = "incomingApplication.status")
    // @Mapping(target = "appliedDate", source = "incomingApplication.appliedDate")
    // @Mapping(target = "notes", source = "incomingApplication.notes")
    // @Mapping(target = "nextActionDate", source =
    // "incomingApplication.nextActionDate")
    // @Mapping(target = "lastUpdated", source = "incomingApplication.lastUpdated")
    // @Mapping(target = "job", source = "job")
    // @Mapping(target = "user", ignore = true)
    // @Mapping(target = "createdOn", ignore = true)
    // void updateEntity(@MappingTarget Application existingApplication,
    // Application incomingApplication, Job job);
}
