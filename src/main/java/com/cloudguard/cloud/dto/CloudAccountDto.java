package com.cloudguard.cloud.dto;
import java.time.OffsetDateTime;
import java.util.UUID;
public record CloudAccountDto(UUID id, String name, String provider, String accountId, String externalId, String roleArn, String primaryRegion, String monitoredRegions, String status, OffsetDateTime lastSyncAt, String syncError, OffsetDateTime createdAt, OffsetDateTime updatedAt) {}
