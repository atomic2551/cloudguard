package com.cloudguard.incident.repository;
import com.cloudguard.incident.entity.IncidentTimeline;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;
@Repository
public interface IncidentTimelineRepository extends JpaRepository<IncidentTimeline, UUID> {
    List<IncidentTimeline> findByIncidentIdOrderByEventTimeDesc(UUID incidentId);
}
