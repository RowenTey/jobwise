package com.rowentey.jobwise.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import com.rowentey.jobwise.dto.company.CompanyCreateRequest;
import com.rowentey.jobwise.dto.company.CompanyDto;
import com.rowentey.jobwise.models.Company;

@Mapper(componentModel = "spring")
public interface CompanyMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    Company toEntity(CompanyCreateRequest request);

    CompanyDto toDto(Company company);
}
