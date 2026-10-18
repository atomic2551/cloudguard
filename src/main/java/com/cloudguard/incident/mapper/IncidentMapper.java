package com.cloudguard.incident.mapper;

import com.cloudguard.incident.dto.IncidentNoteDto;
import com.cloudguard.incident.dto.IncidentDto;
import com.cloudguard.incident.dto.IncidentTimelineDto;
import com.cloudguard.incident.entity.Incident;
import com.cloudguard.incident.entity.IncidentNote;
import com.cloudguard.incident.entity.IncidentTimeline;
import com.cloudguard.common.dto.AlertSeverity;

public class IncidentMapper {
    public static IncidentDto toDto(Incident incident) {
        if (incident == null) return null;
        return new IncidentDto(
            incident.getId(),
            incident.getIncidentNumber(),
            incident.getTitle(),
            incident.getDescription(),
            AlertSeverity.valueOf(incident.getSeverity()),
            incident.getStatus(),
            incident.getCategory(),
            incident.getAssignedTo() != null ? incident.getAssignedTo().getId() : null,
            incident.getAssignedTo() != null ? incident.getAssignedTo().getDisplayName() : null,
            incident.getCreatedBy() != null ? incident.getCreatedBy().getId() : null,
            incident.getCreatedBy() != null ? incident.getCreatedBy().getDisplayName() : null,
            incident.getResolvedAt(),
            incident.getClosedAt(),
            incident.getCreatedAt(),
            incident.getUpdatedAt(),
            null, // alertCount filled in service if needed
            null  // alerts filled in service if needed
        );
    }
    
    public static IncidentNoteDto toDto(IncidentNote n) {
        if (n == null) return null;
        return new IncidentNoteDto(
            n.getId(),
            n.getIncident().getId(),
            n.getAuthor() != null ? n.getAuthor().getId() : null,
            n.getAuthor() != null ? n.getAuthor().getDisplayName() : "System",
            n.getContent(),
            n.isPrivate(),
            n.getCreatedAt()
        );
    }

    public static IncidentTimelineDto toDto(IncidentTimeline t) {
        if (t == null) return null;
        return new IncidentTimelineDto(
            t.getId(),
            t.getIncident().getId(),
            t.getEventTime(),
            t.getEventType(),
            t.getDescription(),
            t.getActor(),
            t.getCreatedAt()
        );
    }
}
