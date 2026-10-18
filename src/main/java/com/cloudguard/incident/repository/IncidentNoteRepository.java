package com.cloudguard.incident.repository;
import com.cloudguard.incident.entity.IncidentNote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;
@Repository
public interface IncidentNoteRepository extends JpaRepository<IncidentNote, UUID> {
    List<IncidentNote> findByIncidentIdOrderByCreatedAtDesc(UUID incidentId);
}
