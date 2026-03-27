package com.hrm.repository;

import com.hrm.entity.CompanyConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CompanyConfigRepository extends JpaRepository<CompanyConfig, String> {
}
