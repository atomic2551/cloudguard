package com.cloudguard.incident.repository;

import com.cloudguard.incident.entity.Incident;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface IncidentRepository extends JpaRepository<Incident, UUID> {

    Optional<Incident> findByIncidentNumber(String incidentNumber);

    /** List with optional filters — NO collection JOIN FETCH */
    @Query("""
        SELECT i FROM Incident i
        WHERE (:severity IS NULL OR i.severity = :severity)
          AND (:status   IS NULL OR i.status   = :status)
          AND (:search   IS NULL OR
               LOWER(i.title)          LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')) OR
               LOWER(i.incidentNumber) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')))
        ORDER BY i.createdAt DESC
        """)
    Page<Incident> findAllWithFilters(
            @Param("severity") String severity,
            @Param("status")   String status,
            @Param("search")   String search,
            Pageable pageable);

    long countByStatus(String status);

    /** Detail query: incident + alerts count via incident_alerts join */
    @Query("SELECT COUNT(ia.alertId) FROM IncidentAlert ia WHERE ia.incidentId = :incidentId")
    long countAlertsByIncidentId(@Param("incidentId") UUID incidentId);
}
