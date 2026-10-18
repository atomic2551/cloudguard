package com.cloudguard.alert.dto;

public class AlertDto {
    private String id;
    private String alertNumber;
    private String title;
    private String description;
    private String severity;
    private String status;
    private String source;
    private String detectionRuleId;
    private String triggerEventId;
    private String cloudAccountId;
    private String sourceIp;
    private String userIdentity;
    private String targetResource;
    private String region;
    private String mitreTechniqueId;
    private String mitreTactic;
    private String assignedTo;
    private String assignedToName;
    private String resolvedAt;
    private String resolvedBy;
    private String createdAt;
    private String updatedAt;

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getAlertNumber() { return alertNumber; }
    public void setAlertNumber(String alertNumber) { this.alertNumber = alertNumber; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getSeverity() { return severity; }
    public void setSeverity(String severity) { this.severity = severity; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getSource() { return source; }
    public void setSource(String source) { this.source = source; }
    public String getDetectionRuleId() { return detectionRuleId; }
    public void setDetectionRuleId(String detectionRuleId) { this.detectionRuleId = detectionRuleId; }
    public String getTriggerEventId() { return triggerEventId; }
    public void setTriggerEventId(String triggerEventId) { this.triggerEventId = triggerEventId; }
    public String getCloudAccountId() { return cloudAccountId; }
    public void setCloudAccountId(String cloudAccountId) { this.cloudAccountId = cloudAccountId; }
    public String getSourceIp() { return sourceIp; }
    public void setSourceIp(String sourceIp) { this.sourceIp = sourceIp; }
    public String getUserIdentity() { return userIdentity; }
    public void setUserIdentity(String userIdentity) { this.userIdentity = userIdentity; }
    public String getTargetResource() { return targetResource; }
    public void setTargetResource(String targetResource) { this.targetResource = targetResource; }
    public String getRegion() { return region; }
    public void setRegion(String region) { this.region = region; }
    public String getMitreTechniqueId() { return mitreTechniqueId; }
    public void setMitreTechniqueId(String mitreTechniqueId) { this.mitreTechniqueId = mitreTechniqueId; }
    public String getMitreTactic() { return mitreTactic; }
    public void setMitreTactic(String mitreTactic) { this.mitreTactic = mitreTactic; }
    public String getAssignedTo() { return assignedTo; }
    public void setAssignedTo(String assignedTo) { this.assignedTo = assignedTo; }
    public String getAssignedToName() { return assignedToName; }
    public void setAssignedToName(String assignedToName) { this.assignedToName = assignedToName; }
    public String getResolvedAt() { return resolvedAt; }
    public void setResolvedAt(String resolvedAt) { this.resolvedAt = resolvedAt; }
    public String getResolvedBy() { return resolvedBy; }
    public void setResolvedBy(String resolvedBy) { this.resolvedBy = resolvedBy; }
    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }
    public String getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(String updatedAt) { this.updatedAt = updatedAt; }
}
