package com.cloudguard.incident.repository;
import com.cloudguard.incident.entity.Incident;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.UUID;

@Repository
public interface IncidentRepository extends JpaRepository<Incident, UUID> {
    
    @Query("SELECT i FROM Incident i LEFT JOIN FETCH i.assignedTo LEFT JOIN FETCH i.createdBy WHERE " +
           "(:severity IS NULL OR i.severity = :severity) AND " +
           "(:status IS NULL OR i.status = :status)")
    Page<Incident> findByFilters(@Param("severity") String severity, @Param("status") String status, Pageable pageable);
}
