package com.rowentey.jobwise.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.rowentey.jobwise.models.Job;

@Repository
public interface JobRepository extends JpaRepository<Job, Long> {
}
