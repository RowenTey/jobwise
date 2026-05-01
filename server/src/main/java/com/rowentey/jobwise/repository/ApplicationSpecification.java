package com.rowentey.jobwise.repository;

import java.time.LocalDateTime;
import java.util.ArrayList;

import org.springframework.data.jpa.domain.Specification;

import com.rowentey.jobwise.enums.ApplicationStatus;
import com.rowentey.jobwise.models.Application;
import com.rowentey.jobwise.models.User;

import jakarta.persistence.criteria.Predicate;

public class ApplicationSpecification {
    public static Specification<Application> withFilters(
            User user,
            ApplicationStatus status,
            Long jobId,
            Long companyId,
            LocalDateTime fromDate,
            LocalDateTime toDate) {
        return (root, query, cb) -> {
            var predicates = new ArrayList<Predicate>();

            // 🔐 Always filter by user
            if (user != null) {
                predicates.add(cb.equal(root.get("user"), user));
            }

            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }

            if (jobId != null) {
                predicates.add(cb.equal(root.get("job").get("id"), jobId));
            }

            if (companyId != null) {
                predicates.add(cb.equal(root.get("job").get("company").get("id"), companyId));
            }

            if (fromDate != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("createdOn"), fromDate));
            }

            if (toDate != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("createdOn"), toDate));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
