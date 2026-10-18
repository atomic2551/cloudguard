package com.cloudguard.event.dto;
import com.cloudguard.common.dto.AlertSeverity;
import java.time.OffsetDateTime;
import java.util.Map;
import java.util.UUID;
public record SecurityEventDto(UUID id, UUID rawLogId, UUID cloudAccountId, String cloudAccountName, OffsetDateTime eventTime, String eventType, String eventSource, String sourceIp, String userIdentity, String targetResource, String region, String severity, Object requestParameters, Object responseElements, boolean isError, String errorCode, String errorMessage, boolean processedByEngine, OffsetDateTime createdAt) {}
