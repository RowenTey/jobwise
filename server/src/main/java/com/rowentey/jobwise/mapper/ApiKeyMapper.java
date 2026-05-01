package com.rowentey.jobwise.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import com.rowentey.jobwise.dto.auth.ApiKeyResponse;
import com.rowentey.jobwise.models.ApiKey;

@Mapper(componentModel = "spring")
public interface ApiKeyMapper {

    @Mapping(target = "rawKey", ignore = true)
    ApiKeyResponse toDto(ApiKey apiKey);
}
