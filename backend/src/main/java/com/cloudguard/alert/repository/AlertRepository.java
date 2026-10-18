package com.cloudguard.alert.repository;

import com.cloudguard.alert.entity.Alert;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface AlertRepository extends JpaRepository<Alert, UUID> {

    Optional<Alert> findByAlertNumber(String alertNumber);

    /** List with optional filters — NO collection JOIN FETCH to avoid pagination issues */
    @Query("""
        SELECT a FROM Alert a
        WHERE (:severity IS NULL OR a.severity = :severity)
          AND (:status   IS NULL OR a.status   = :status)
          AND (:search   IS NULL OR
               LOWER(a.title)       LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')) OR
               LOWER(a.alertNumber) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')) OR
               LOWER(a.sourceIp)    LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')))
        ORDER BY a.createdAt DESC
        """)
    Page<Alert> findAllWithFilters(
            @Param("severity") String severity,
            @Param("status")   String status,
            @Param("search")   String search,
            Pageable pageable);

    /** Count only — used by dashboard */
    long countBySeverity(String severity);

    long countByStatus(String status);
}
