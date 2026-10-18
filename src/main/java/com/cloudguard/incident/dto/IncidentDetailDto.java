package com.cloudguard.incident.dto;
import java.util.List;
public record IncidentDetailDto(
    IncidentDto incident,
    List<IncidentNoteDto> notes,
    List<IncidentTimelineDto> timeline
) {}
