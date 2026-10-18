package com.cloudguard.event.mapper;

import com.cloudguard.event.dto.SecurityEventDto;
import com.cloudguard.event.entity.SecurityEvent;
import org.springframework.stereotype.Component;

@Component
public class SecurityEventMapper {

    public SecurityEventDto toDto(SecurityEvent event) {
        if (event == null) return null;

        SecurityEventDto dto = new SecurityEventDto();
        dto.setId(event.getId().toString());
        
        if (event.getRawLogId() != null) {
            dto.setRawLogId(event.getRawLogId().toString());
        }
        
        if (event.getCloudAccount() != null) {
            dto.setCloudAccountId(event.getCloudAccount().getId().toString());
            // Map Name dynamically if lazy loading is handled or from explicit JOIN
            // The Next.js contract returns accountName string. Currently, JPA handles it via standard getters.
            dto.setCloudAccountName(event.getCloudAccount().getName()); 
        }

        if (event.getEventTime() != null) {
            dto.setEventTime(event.getEventTime().toString());
        }

        dto.setEventType(event.getEventType());
        dto.setEventSource(event.getEventSource());
        dto.setSourceIp(event.getSourceIp());
        dto.setUserIdentity(event.getUserIdentity());
        dto.setTargetResource(event.getTargetResource());
        dto.setRegion(event.getRegion());
        dto.setSeverity(event.getSeverity());
        
        dto.setRequestParameters(event.getRequestParameters());
        dto.setResponseElements(event.getResponseElements());
        
        dto.setError(event.isError());
        dto.setErrorCode(event.getErrorCode());
        dto.setErrorMessage(event.getErrorMessage());
        dto.setProcessedByEngine(event.isProcessedByEngine());
        
        if (event.getCreatedAt() != null) {
            dto.setCreatedAt(event.getCreatedAt().toString());
        }

        return dto;
    }
}
