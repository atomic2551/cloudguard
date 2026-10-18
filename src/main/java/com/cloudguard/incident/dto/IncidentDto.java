package com.cloudguard.incident.dto;

import com.cloudguard.alert.dto.AlertDto;
import com.cloudguard.common.dto.AlertSeverity;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public record IncidentDto(
    UUID id,
    String incidentNumber,
    String title,
    String description,
    AlertSeverity severity,
    String status,
    String category,
    UUID assignedTo,
    String assignedToName,
    UUID createdBy,
    String createdByName,
    OffsetDateTime resolvedAt,
    OffsetDateTime closedAt,
    OffsetDateTime createdAt,
    OffsetDateTime updatedAt,
    Integer alertCount,
    List<AlertDto> alerts
) {}
