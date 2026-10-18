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
    @Query("SELECT e FROM SecurityEvent e WHERE " +
           "(:severity IS NULL OR e.severity = :severity)")
    Page<SecurityEvent> findByFilters(@Param("severity") String severity, Pageable pageable);
}
