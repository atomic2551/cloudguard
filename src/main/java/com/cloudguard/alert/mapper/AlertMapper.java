package com.cloudguard.alert.mapper;

import com.cloudguard.alert.dto.AlertCommentDto;
import com.cloudguard.alert.dto.AlertDto;
import com.cloudguard.alert.dto.AlertTimelineDto;
import com.cloudguard.alert.entity.Alert;
import com.cloudguard.alert.entity.AlertComment;
import com.cloudguard.alert.entity.AlertTimeline;
import com.cloudguard.common.dto.AlertSeverity;

public class AlertMapper {
    public static AlertDto toDto(Alert alert) {
        if (alert == null) return null;
        return new AlertDto(
            alert.getId(),
            alert.getAlertNumber(),
            alert.getTitle(),
            alert.getDescription(),
            AlertSeverity.valueOf(alert.getSeverity()),
            alert.getStatus(),
            alert.getSource(),
            alert.getDetectionRuleId(),
            alert.getTriggerEvent() != null ? alert.getTriggerEvent().getId() : null,
            alert.getCloudAccount() != null ? alert.getCloudAccount().getId() : null,
            alert.getSourceIp(),
            alert.getUserIdentity(),
            alert.getTargetResource(),
            alert.getRegion(),
            alert.getMitreTechniqueId(),
            alert.getMitreTactic(),
            alert.getAssignedTo() != null ? alert.getAssignedTo().getId() : null,
            alert.getAssignedTo() != null ? alert.getAssignedTo().getDisplayName() : null,
            alert.getResolvedAt(),
            alert.getResolvedBy() != null ? alert.getResolvedBy().getId() : null,
            alert.getCreatedAt(),
            alert.getUpdatedAt()
        );
    }
    
    public static AlertCommentDto toDto(AlertComment comment) {
        if (comment == null) return null;
        return new AlertCommentDto(
            comment.getId(),
            comment.getAlert().getId(),
            comment.getAuthor() != null ? comment.getAuthor().getId() : null,
            comment.getAuthor() != null ? comment.getAuthor().getDisplayName() : "System",
            comment.getContent(),
            comment.getCreatedAt()
        );
    }

    public static AlertTimelineDto toDto(AlertTimeline t) {
        if (t == null) return null;
        return new AlertTimelineDto(
            t.getId(),
            t.getAlert().getId(),
            t.getEventTime(),
            t.getEventType(),
            t.getDescription(),
            t.getSeverity(),
            t.getActor(),
            t.getCreatedAt()
        );
    }
}
