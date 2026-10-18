package com.cloudguard.incident.repository;

import com.cloudguard.incident.entity.IncidentTimeline;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface IncidentTimelineRepository extends JpaRepository<IncidentTimeline, UUID> {

    @Query("SELECT t FROM IncidentTimeline t WHERE t.incident.id = :incidentId ORDER BY t.eventTime ASC")
    List<IncidentTimeline> findByIncidentIdOrderByEventTimeAsc(@Param("incidentId") UUID incidentId);
}
