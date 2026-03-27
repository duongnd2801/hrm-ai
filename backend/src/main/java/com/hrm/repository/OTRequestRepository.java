package com.hrm.repository;

import com.hrm.entity.OTRequest;
import com.hrm.entity.OTStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface OTRequestRepository extends JpaRepository<OTRequest, UUID> {
    List<OTRequest> findByEmployeeId(UUID employeeId);
    List<OTRequest> findByStatus(OTStatus status);
}
