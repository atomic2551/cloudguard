package com.cloudguard.incident.dto;
import java.time.OffsetDateTime;
import java.util.UUID;
public record IncidentNoteDto(UUID id, UUID incidentId, UUID authorId, String authorName, String content, boolean isPrivate, OffsetDateTime createdAt) {}
