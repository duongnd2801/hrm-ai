package com.hrm.repository;

import com.hrm.entity.Position;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface PositionRepository extends JpaRepository<Position, UUID> {
    boolean existsByNameIgnoreCase(String name);
}
