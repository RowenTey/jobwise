package com.rowentey.jobwise.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import com.rowentey.jobwise.dto.auth.SignUpRequest;
import com.rowentey.jobwise.models.User;

@Mapper(componentModel = "spring")
public interface UserMapper {
    // UserDto toDto(User user);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "roles", ignore = true)
    @Mapping(target = "authorities", ignore = true)
    User toEntity(SignUpRequest request);

    // User toEntity(UserCreateRequest request);

    // @Mapping(target = "id", source = "id")
    // User toEntity(Long id, UserUpdateRequest request);
}
