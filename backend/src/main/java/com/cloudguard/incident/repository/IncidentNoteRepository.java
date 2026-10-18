package com.cloudguard.incident.repository;

import com.cloudguard.incident.entity.IncidentNote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface IncidentNoteRepository extends JpaRepository<IncidentNote, UUID> {

    @Query("SELECT n FROM IncidentNote n LEFT JOIN FETCH n.author WHERE n.incident.id = :incidentId ORDER BY n.createdAt ASC")
    List<IncidentNote> findByIncidentIdWithAuthor(@Param("incidentId") UUID incidentId);
}
