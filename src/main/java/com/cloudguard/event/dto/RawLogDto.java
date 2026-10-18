package com.cloudguard.event.dto;
import java.time.OffsetDateTime;
import java.util.UUID;
public record RawLogDto(UUID id, UUID cloudAccountId, String source, OffsetDateTime receivedAt, Object rawPayload, String payloadHash, boolean processed, OffsetDateTime processedAt, String processingError) {}
