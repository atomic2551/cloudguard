package com.cloudguard.incident.mapper;

import com.cloudguard.incident.dto.IncidentDto;
import com.cloudguard.incident.dto.IncidentNoteDto;
import com.cloudguard.incident.dto.IncidentTimelineDto;
import com.cloudguard.incident.entity.Incident;
import com.cloudguard.incident.entity.IncidentNote;
import com.cloudguard.incident.entity.IncidentTimeline;
import org.springframework.stereotype.Component;

@Component
public class IncidentMapper {

    public IncidentDto toDto(Incident incident, Long alertCount) {
        if (incident == null) return null;

        IncidentDto dto = new IncidentDto();
        dto.setId(incident.getId().toString());
        dto.setIncidentNumber(incident.getIncidentNumber());
        dto.setTitle(incident.getTitle());
        dto.setDescription(incident.getDescription());
        dto.setSeverity(incident.getSeverity());
        dto.setStatus(incident.getStatus());
        dto.setCategory(incident.getCategory());

        if (incident.getAssignedTo() != null) {
            dto.setAssignedTo(incident.getAssignedTo().getId().toString());
            dto.setAssignedToName(incident.getAssignedTo().getDisplayName());
        }

        if (incident.getCreatedBy() != null) {
            dto.setCreatedBy(incident.getCreatedBy().getId().toString());
            dto.setCreatedByName(incident.getCreatedBy().getDisplayName());
        }

        if (incident.getResolvedAt() != null) {
            dto.setResolvedAt(incident.getResolvedAt().toString());
        }
        if (incident.getClosedAt() != null) {
            dto.setClosedAt(incident.getClosedAt().toString());
        }

        if (incident.getCreatedAt() != null) {
            dto.setCreatedAt(incident.getCreatedAt().toString());
        }
        if (incident.getUpdatedAt() != null) {
            dto.setUpdatedAt(incident.getUpdatedAt().toString());
        }

        dto.setAlertCount(alertCount);
        
        return dto;
    }

    public IncidentNoteDto toNoteDto(IncidentNote note) {
        if (note == null) return null;
        
        IncidentNoteDto dto = new IncidentNoteDto();
        dto.setId(note.getId().toString());
        dto.setIncidentId(note.getIncident().getId().toString());
        
        if (note.getAuthor() != null) {
            dto.setAuthorId(note.getAuthor().getId().toString());
            dto.setAuthorName(note.getAuthor().getDisplayName());
        } else {
            dto.setAuthorName("System");
        }
        
        dto.setContent(note.getContent());
        dto.setPrivate(note.isPrivate());
        
        if (note.getCreatedAt() != null) {
            dto.setCreatedAt(note.getCreatedAt().toString());
        }
        
        return dto;
    }

    public IncidentTimelineDto toTimelineDto(IncidentTimeline timeline) {
        if (timeline == null) return null;
        
        IncidentTimelineDto dto = new IncidentTimelineDto();
        dto.setId(timeline.getId().toString());
        dto.setIncidentId(timeline.getIncident().getId().toString());
        
        if (timeline.getEventTime() != null) {
            dto.setEventTime(timeline.getEventTime().toString());
        }
        
        dto.setEventType(timeline.getEventType());
        dto.setDescription(timeline.getDescription());
        dto.setActor(timeline.getActor());
        
        if (timeline.getCreatedAt() != null) {
            dto.setCreatedAt(timeline.getCreatedAt().toString());
        }
        
        return dto;
    }
}
