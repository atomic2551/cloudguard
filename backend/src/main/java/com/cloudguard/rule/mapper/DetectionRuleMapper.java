package com.cloudguard.rule.mapper;

import com.cloudguard.rule.dto.DetectionRuleDto;
import com.cloudguard.rule.entity.DetectionRule;
import org.springframework.stereotype.Component;

@Component
public class DetectionRuleMapper {

    public DetectionRuleDto toDto(DetectionRule rule) {
        if (rule == null) return null;

        DetectionRuleDto dto = new DetectionRuleDto();
        dto.setId(rule.getId().toString());
        dto.setName(rule.getName());
        dto.setDescription(rule.getDescription());
        dto.setRuleType(rule.getRuleType());
        dto.setCategory(rule.getCategory());
        dto.setSeverity(rule.getSeverity());
        dto.setEnabled(rule.isEnabled());
        dto.setLogicDefinition(rule.getLogicDefinition());
        dto.setTriggerDescription(rule.getTriggerDescription());
        dto.setMitreTechniqueId(rule.getMitreTechniqueId());
        dto.setMitreTactic(rule.getMitreTactic());
        dto.setCooldownMinutes(rule.getCooldownMinutes());
        dto.setAlertCount(rule.getAlertCount());

        if (rule.getLastTriggeredAt() != null) {
            dto.setLastTriggeredAt(rule.getLastTriggeredAt().toString());
        }
        if (rule.getCreatedBy() != null) {
            dto.setCreatedBy(rule.getCreatedBy().getDisplayName());
        }
        if (rule.getCreatedAt() != null) {
            dto.setCreatedAt(rule.getCreatedAt().toString());
        }
        if (rule.getUpdatedAt() != null) {
            dto.setUpdatedAt(rule.getUpdatedAt().toString());
        }

        return dto;
    }
}
