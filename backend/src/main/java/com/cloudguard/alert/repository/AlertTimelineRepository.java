package com.cloudguard.alert.repository;

import com.cloudguard.alert.entity.AlertTimeline;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AlertTimelineRepository extends JpaRepository<AlertTimeline, UUID> {

    @Query("SELECT t FROM AlertTimeline t WHERE t.alert.id = :alertId ORDER BY t.eventTime ASC")
    List<AlertTimeline> findByAlertIdOrderByEventTimeAsc(@Param("alertId") UUID alertId);
}
