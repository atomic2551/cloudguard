package com.cloudguard.finding.mapper;

import com.cloudguard.finding.dto.IamFindingDto;
import com.cloudguard.finding.entity.IamFinding;
import org.springframework.stereotype.Component;

@Component
public class IamFindingMapper {

    public IamFindingDto toDto(IamFinding finding) {
        if (finding == null) return null;

        IamFindingDto dto = new IamFindingDto();
        dto.setId(finding.getId().toString());
        dto.setFindingNumber(finding.getFindingNumber());
        dto.setTitle(finding.getTitle());
        dto.setDescription(finding.getDescription());
        dto.setSeverity(finding.getSeverity());
        dto.setCategory(finding.getCategory());
        dto.setStatus(finding.getStatus());
        
        if (finding.getCloudAccount() != null) {
            dto.setCloudAccountId(finding.getCloudAccount().getId().toString());
        }
        
        dto.setAffectedPrincipal(finding.getAffectedPrincipal());
        dto.setPrincipalType(finding.getPrincipalType());
        dto.setRecommendation(finding.getRecommendation());
        
        if (finding.getDetectedAt() != null) {
            dto.setDetectedAt(finding.getDetectedAt().toString());
        }
        if (finding.getRemediatedAt() != null) {
            dto.setRemediatedAt(finding.getRemediatedAt().toString());
        }
        if (finding.getCreatedAt() != null) {
            dto.setCreatedAt(finding.getCreatedAt().toString());
        }
        if (finding.getUpdatedAt() != null) {
            dto.setUpdatedAt(finding.getUpdatedAt().toString());
        }

        return dto;
    }
}
