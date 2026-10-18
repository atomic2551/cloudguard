package com.cloudguard.incident.dto;
import java.time.OffsetDateTime;
import java.util.UUID;
public record IncidentTimelineDto(UUID id, UUID incidentId, OffsetDateTime eventTime, String eventType, String description, String actor, OffsetDateTime createdAt) {}
