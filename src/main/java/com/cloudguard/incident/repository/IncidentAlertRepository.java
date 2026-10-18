package com.cloudguard.incident.repository;
import com.cloudguard.incident.entity.IncidentAlert;
import com.cloudguard.incident.entity.IncidentAlertId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;
@Repository
public interface IncidentAlertRepository extends JpaRepository<IncidentAlert, IncidentAlertId> {
    List<IncidentAlert> findByIncidentId(UUID incidentId);
}
