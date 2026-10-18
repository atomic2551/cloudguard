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
    @Query("SELECT f FROM SecurityFinding f WHERE (:severity IS NULL OR f.severity = :severity) AND (:status IS NULL OR f.status = :status)")
    Page<SecurityFinding> findByFilters(@Param("severity") String severity, @Param("status") String status, Pageable pageable);
}
