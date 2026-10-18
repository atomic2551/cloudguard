package com.cloudguard.alert.dto;

import com.cloudguard.common.dto.AlertSeverity;
import java.time.OffsetDateTime;
import java.util.UUID;

public record AlertDto(
    UUID id,
    String alertNumber,
    String title,
    String description,
    AlertSeverity severity,
    String status,
    String source,
    UUID detectionRuleId,
    UUID triggerEventId,
    UUID cloudAccountId,
    String sourceIp,
    String userIdentity,
    String targetResource,
    String region,
    String mitreTechniqueId,
    String mitreTactic,
    UUID assignedTo,
    String assignedToName,
    OffsetDateTime resolvedAt,
    UUID resolvedBy,
    OffsetDateTime createdAt,
    OffsetDateTime updatedAt
) {}
