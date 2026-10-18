package com.cloudguard.event.mapper;

import com.cloudguard.event.dto.SecurityEventDto;
import com.cloudguard.event.entity.SecurityEvent;
import com.cloudguard.common.dto.AlertSeverity;

public class SecurityEventMapper {
    public static SecurityEventDto toDto(SecurityEvent event) {
        if (event == null) return null;
        return new SecurityEventDto(
            event.getId(),
            null, // rawLogId
            event.getCloudAccount() != null ? event.getCloudAccount().getId() : null,
            event.getCloudAccount() != null ? event.getCloudAccount().getName() : null,
            event.getEventTime(),
            event.getEventType(),
            event.getEventSource(),
            event.getSourceIp(),
            event.getUserIdentity(),
            event.getTargetResource(),
            event.getRegion(),
            event.getSeverity(),
            null, // requestParameters
            null, // responseElements
            event.isError(),
            event.getErrorCode(),
            event.getErrorMessage(),
            event.isProcessedByEngine(),
            event.getCreatedAt()
        );
    }
}
