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
}
