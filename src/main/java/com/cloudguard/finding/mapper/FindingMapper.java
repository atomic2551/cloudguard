package com.cloudguard.finding.mapper;
import com.cloudguard.finding.dto.IamFindingDto;
import com.cloudguard.finding.dto.SecurityFindingDto;
import com.cloudguard.finding.entity.IamFinding;
import com.cloudguard.finding.entity.SecurityFinding;
import com.cloudguard.common.dto.AlertSeverity;

public class FindingMapper {
    public static SecurityFindingDto toDto(SecurityFinding f) {
        if (f == null) return null;
        return new SecurityFindingDto(f.getId(), f.getFindingNumber(), f.getTitle(), f.getDescription(), AlertSeverity.valueOf(f.getSeverity()), f.getCategory(), f.getStatus(), f.getCloudAccount() != null ? f.getCloudAccount().getId() : null, f.getResourceId(), f.getRegion(), f.getRecommendation(), f.getRiskScore(), null, f.getDetectedAt(), f.getRemediatedAt(), f.getSuppressedBy() != null ? f.getSuppressedBy().getId() : null, f.getCreatedAt(), f.getUpdatedAt());
    }
    public static IamFindingDto toDto(IamFinding f) {
        if (f == null) return null;
        return new IamFindingDto(f.getId(), f.getFindingNumber(), f.getTitle(), f.getDescription(), AlertSeverity.valueOf(f.getSeverity()), f.getCategory(), f.getStatus(), f.getCloudAccount() != null ? f.getCloudAccount().getId() : null, f.getAffectedPrincipal(), f.getPrincipalType(), f.getRecommendation(), f.getDetectedAt(), f.getRemediatedAt(), f.getCreatedAt(), f.getUpdatedAt());
    }
}
