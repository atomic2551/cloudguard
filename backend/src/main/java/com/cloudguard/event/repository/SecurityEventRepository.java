package com.cloudguard.event.repository;

import com.cloudguard.event.entity.SecurityEvent;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface SecurityEventRepository extends JpaRepository<SecurityEvent, UUID> {

    /**
     * Filters: severity (exact) + search on eventType, sourceIp, userIdentity.
     * No JOIN FETCH on list — cloudAccount name is resolved per-record in mapper.
     */
    @Query("""
        SELECT e FROM SecurityEvent e
        WHERE (:severity IS NULL OR e.severity = :severity)
          AND (:search   IS NULL OR
               LOWER(e.eventType)     LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')) OR
               LOWER(e.sourceIp)      LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')) OR
               LOWER(e.userIdentity)  LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')))
        ORDER BY e.eventTime DESC
        """)
    Page<SecurityEvent> findAllWithFilters(
            @Param("severity") String severity,
            @Param("search")   String search,
            Pageable pageable);
}
