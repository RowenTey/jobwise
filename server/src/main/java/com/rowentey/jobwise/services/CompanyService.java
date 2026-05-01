package com.rowentey.jobwise.services;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import com.rowentey.jobwise.dto.company.CompanyCreateRequest;
import com.rowentey.jobwise.dto.company.CompanyDto;
import com.rowentey.jobwise.mapper.CompanyMapper;
import com.rowentey.jobwise.models.Company;
import com.rowentey.jobwise.repository.CompanyRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class CompanyService {

    private final CompanyRepository companyRepository;
    private final CompanyMapper companyMapper;

    public Page<CompanyDto> getCompanies(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return companyRepository.findAll(pageable).map(companyMapper::toDto);
    }

    public Company createCompany(CompanyCreateRequest request) {
        try {
            Company company = companyMapper.toEntity(request);
            return companyRepository.save(company);
        } catch (Exception e) {
            log.error("Error creating company: {}", e.getMessage());
            throw e;
        }
    }
}
