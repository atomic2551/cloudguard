package com.cloudguard.finding.mapper;

import com.cloudguard.finding.dto.SecurityFindingDto;
import com.cloudguard.finding.entity.SecurityFinding;
import org.springframework.stereotype.Component;

@Component
public class SecurityFindingMapper {

    public SecurityFindingDto toDto(SecurityFinding finding) {
        if (finding == null) return null;

        SecurityFindingDto dto = new SecurityFindingDto();
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
        
        dto.setResourceId(finding.getResourceId());
        dto.setRegion(finding.getRegion());
        dto.setRecommendation(finding.getRecommendation());
        dto.setRiskScore(finding.getRiskScore());
        dto.setComplianceFrameworks(finding.getComplianceFrameworks());
        
        if (finding.getDetectedAt() != null) {
            dto.setDetectedAt(finding.getDetectedAt().toString());
        }
        if (finding.getRemediatedAt() != null) {
            dto.setRemediatedAt(finding.getRemediatedAt().toString());
        }
        if (finding.getSuppressedBy() != null) {
            dto.setSuppressedBy(finding.getSuppressedBy().getId().toString());
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
