package com.cloudguard.alert.mapper;

import com.cloudguard.alert.dto.AlertCommentDto;
import com.cloudguard.alert.dto.AlertDto;
import com.cloudguard.alert.dto.AlertTimelineDto;
import com.cloudguard.alert.entity.Alert;
import com.cloudguard.alert.entity.AlertComment;
import com.cloudguard.alert.entity.AlertTimeline;
import org.springframework.stereotype.Component;

@Component
public class AlertMapper {

    public AlertDto toDto(Alert alert) {
        if (alert == null) return null;

        AlertDto dto = new AlertDto();
        dto.setId(alert.getId().toString());
        dto.setAlertNumber(alert.getAlertNumber());
        dto.setTitle(alert.getTitle());
        dto.setDescription(alert.getDescription());
        dto.setSeverity(alert.getSeverity());
        dto.setStatus(alert.getStatus());
        dto.setSource(alert.getSource());
        
        if (alert.getDetectionRuleId() != null) {
            dto.setDetectionRuleId(alert.getDetectionRuleId().toString());
        }
        if (alert.getTriggerEvent() != null) {
            dto.setTriggerEventId(alert.getTriggerEvent().getId().toString());
        }
        if (alert.getCloudAccount() != null) {
            dto.setCloudAccountId(alert.getCloudAccount().getId().toString());
        }
        
        dto.setSourceIp(alert.getSourceIp());
        dto.setUserIdentity(alert.getUserIdentity());
        dto.setTargetResource(alert.getTargetResource());
        dto.setRegion(alert.getRegion());
        dto.setMitreTechniqueId(alert.getMitreTechniqueId());
        dto.setMitreTactic(alert.getMitreTactic());

        if (alert.getAssignedTo() != null) {
            dto.setAssignedTo(alert.getAssignedTo().getId().toString());
            dto.setAssignedToName(alert.getAssignedTo().getDisplayName()); // Assuming eagerly loaded or lazy loading works in transaction
        }

        if (alert.getResolvedAt() != null) {
            dto.setResolvedAt(alert.getResolvedAt().toString());
        }
        if (alert.getResolvedBy() != null) {
            dto.setResolvedBy(alert.getResolvedBy().getId().toString());
        }

        if (alert.getCreatedAt() != null) {
            dto.setCreatedAt(alert.getCreatedAt().toString());
        }
        if (alert.getUpdatedAt() != null) {
            dto.setUpdatedAt(alert.getUpdatedAt().toString());
        }

        return dto;
    }

    public AlertCommentDto toCommentDto(AlertComment comment) {
        if (comment == null) return null;

        AlertCommentDto dto = new AlertCommentDto();
        dto.setId(comment.getId().toString());
        dto.setAlertId(comment.getAlert().getId().toString());
        
        if (comment.getAuthor() != null) {
            dto.setAuthorId(comment.getAuthor().getId().toString());
            dto.setAuthorName(comment.getAuthor().getDisplayName());
        } else {
            dto.setAuthorName("System");
        }
        
        dto.setContent(comment.getContent());
        if (comment.getCreatedAt() != null) {
            dto.setCreatedAt(comment.getCreatedAt().toString());
        }

        return dto;
    }

    public AlertTimelineDto toTimelineDto(AlertTimeline timeline) {
        if (timeline == null) return null;

        AlertTimelineDto dto = new AlertTimelineDto();
        dto.setId(timeline.getId().toString());
        dto.setAlertId(timeline.getAlert().getId().toString());
        if (timeline.getEventTime() != null) {
            dto.setEventTime(timeline.getEventTime().toString());
        }
        dto.setEventType(timeline.getEventType());
        dto.setDescription(timeline.getDescription());
        dto.setSeverity(timeline.getSeverity());
        dto.setActor(timeline.getActor());
        if (timeline.getCreatedAt() != null) {
            dto.setCreatedAt(timeline.getCreatedAt().toString());
        }

        return dto;
    }
}
