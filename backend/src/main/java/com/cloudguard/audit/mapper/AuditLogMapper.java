package com.cloudguard.audit.mapper;

import com.cloudguard.audit.dto.AuditLogDto;
import com.cloudguard.audit.entity.AuditLog;
import org.springframework.stereotype.Component;

@Component
public class AuditLogMapper {

    public AuditLogDto toDto(AuditLog log) {
        if (log == null) return null;

        AuditLogDto dto = new AuditLogDto();
        dto.setId(log.getId().toString());
        if (log.getUser() != null) {
            dto.setUserId(log.getUser().getId().toString());
        }
        dto.setUserDisplayName(log.getUserDisplayName());
        dto.setAction(log.getAction());
        dto.setResourceType(log.getResourceType());
        dto.setResourceId(log.getResourceId());
        dto.setIpAddress(log.getIpAddress());
        dto.setResult(log.getResult());
        dto.setDetails(log.getDetails());
        if (log.getCreatedAt() != null) {
            dto.setCreatedAt(log.getCreatedAt().toString());
        }

        return dto;
    }
}
