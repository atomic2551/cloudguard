package com.cloudguard.alert.dto;
import java.time.OffsetDateTime;
import java.util.UUID;
public record AlertCommentDto(UUID id, UUID alertId, UUID authorId, String authorName, String content, OffsetDateTime createdAt) {}
