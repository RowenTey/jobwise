package com.rowentey.jobwise.mapper;

import com.rowentey.jobwise.models.RefreshToken;
import com.rowentey.jobwise.models.User;
import java.util.Date;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface RefreshTokenMapper {
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "user", source = "user")
    @Mapping(target = "tokenHash", source = "tokenHash")
    @Mapping(target = "expiresAt", source = "expiresAt")
    @Mapping(target = "createdAt", source = "createdAt")
    @Mapping(target = "revokedAt", ignore = true)
    RefreshToken toEntity(User user, String tokenHash, Date expiresAt, Date createdAt);
}
