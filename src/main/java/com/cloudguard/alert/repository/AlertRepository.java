package com.cloudguard.alert.repository;
import com.cloudguard.alert.entity.Alert;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.UUID;

@Repository
public interface AlertRepository extends JpaRepository<Alert, UUID> {
    
    @Query("SELECT a FROM Alert a LEFT JOIN FETCH a.assignedTo WHERE " +
           "(:severity IS NULL OR a.severity = :severity) AND " +
           "(:status IS NULL OR a.status = :status)")
    Page<Alert> findByFilters(@Param("severity") String severity, @Param("status") String status, Pageable pageable);
}
