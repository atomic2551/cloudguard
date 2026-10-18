package com.cloudguard.finding.dto;
import com.cloudguard.common.dto.AlertSeverity;
import java.time.OffsetDateTime;
import java.util.UUID;
public record IamFindingDto(UUID id, String findingNumber, String title, String description, AlertSeverity severity, String category, String status, UUID cloudAccountId, String affectedPrincipal, String principalType, String recommendation, OffsetDateTime detectedAt, OffsetDateTime remediatedAt, OffsetDateTime createdAt, OffsetDateTime updatedAt) {}
