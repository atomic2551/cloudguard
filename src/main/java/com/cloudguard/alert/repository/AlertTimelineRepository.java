package com.cloudguard.alert.repository;
import com.cloudguard.alert.entity.AlertTimeline;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;
@Repository
public interface AlertTimelineRepository extends JpaRepository<AlertTimeline, UUID> {
    List<AlertTimeline> findByAlertIdOrderByEventTimeDesc(UUID alertId);
}
