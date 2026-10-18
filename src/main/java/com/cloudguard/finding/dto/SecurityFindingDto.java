package com.cloudguard.finding.dto;
import com.cloudguard.common.dto.AlertSeverity;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
public record SecurityFindingDto(UUID id, String findingNumber, String title, String description, AlertSeverity severity, String category, String status, UUID cloudAccountId, String resourceId, String region, String recommendation, Integer riskScore, List<String> complianceFrameworks, OffsetDateTime detectedAt, OffsetDateTime remediatedAt, UUID suppressedBy, OffsetDateTime createdAt, OffsetDateTime updatedAt) {}
