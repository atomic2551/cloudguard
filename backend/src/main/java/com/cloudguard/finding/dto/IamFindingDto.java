package com.cloudguard.finding.dto;

public class IamFindingDto {
    private String id;
    private String findingNumber;
    private String title;
    private String description;
    private String severity;
    private String category;
    private String status;
    private String cloudAccountId;
    private String affectedPrincipal;
    private String principalType;
    private String recommendation;
    private String detectedAt;
    private String remediatedAt;
    private String createdAt;
    private String updatedAt;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getFindingNumber() { return findingNumber; }
    public void setFindingNumber(String findingNumber) { this.findingNumber = findingNumber; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getSeverity() { return severity; }
    public void setSeverity(String severity) { this.severity = severity; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getCloudAccountId() { return cloudAccountId; }
    public void setCloudAccountId(String cloudAccountId) { this.cloudAccountId = cloudAccountId; }
    public String getAffectedPrincipal() { return affectedPrincipal; }
    public void setAffectedPrincipal(String affectedPrincipal) { this.affectedPrincipal = affectedPrincipal; }
    public String getPrincipalType() { return principalType; }
    public void setPrincipalType(String principalType) { this.principalType = principalType; }
    public String getRecommendation() { return recommendation; }
    public void setRecommendation(String recommendation) { this.recommendation = recommendation; }
    public String getDetectedAt() { return detectedAt; }
    public void setDetectedAt(String detectedAt) { this.detectedAt = detectedAt; }
    public String getRemediatedAt() { return remediatedAt; }
    public void setRemediatedAt(String remediatedAt) { this.remediatedAt = remediatedAt; }
    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }
    public String getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(String updatedAt) { this.updatedAt = updatedAt; }
}
