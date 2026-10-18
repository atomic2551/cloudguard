package com.cloudguard.alert.dto;
import java.time.OffsetDateTime;
import java.util.UUID;
public record AlertTimelineDto(UUID id, UUID alertId, OffsetDateTime eventTime, String eventType, String description, String severity, String actor, OffsetDateTime createdAt) {}
