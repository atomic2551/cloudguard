package com.cloudguard.finding.repository;

import com.cloudguard.finding.entity.SecurityFinding;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface SecurityFindingRepository extends JpaRepository<SecurityFinding, UUID> {

    /** Filters: severity, category, status — matching frontend scanner/findings contract */
    @Query("""
        SELECT f FROM SecurityFinding f
        WHERE (:severity IS NULL OR f.severity = :severity)
          AND (:category IS NULL OR f.category = :category)
          AND (:status   IS NULL OR f.status   = :status)
        ORDER BY f.riskScore DESC
        """)
    Page<SecurityFinding> findAllWithFilters(
            @Param("severity") String severity,
            @Param("category") String category,
            @Param("status")   String status,
            Pageable pageable);

    long countBySeverity(String severity);
    long countByStatus(String status);
}
