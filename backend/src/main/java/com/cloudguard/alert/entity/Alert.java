package com.cloudguard.alert.entity;

import com.cloudguard.cloud.entity.CloudAccount;
import com.cloudguard.event.entity.SecurityEvent;
import com.cloudguard.user.entity.User;
import jakarta.persistence.*;
import java.time.OffsetDateTime;
import java.util.UUID;
import org.hibernate.annotations.Generated;

@Entity
@Table(name = "alerts")

public class Alert {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    // Generated dynamically by DB sequence as per V1__init.sql default clause. 
    @Column(name = "alert_number", updatable = false, insertable = false, nullable = false)
    @Generated
    private String alertNumber;

    @Column(nullable = false, length = 500)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false, length = 20)
    private String severity;

    @Column(nullable = false, length = 20)
    private String status = "NEW";

    @Column(nullable = false, length = 50)
    private String source;

    @Column(name = "detection_rule_id")
    private UUID detectionRuleId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "trigger_event_id")
    private SecurityEvent triggerEvent;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cloud_account_id")
    private CloudAccount cloudAccount;

    @Column(name = "source_ip", length = 45)
    private String sourceIp;

    @Column(name = "user_identity", length = 300)
    private String userIdentity;

    @Column(name = "target_resource", length = 500)
    private String targetResource;

    @Column(length = 30)
    private String region;

    @Column(name = "mitre_technique_id", length = 20)
    private String mitreTechniqueId;

    @Column(name = "mitre_tactic", length = 50)
    private String mitreTactic;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_to")
    private User assignedTo;

    @Column(name = "resolved_at")
    private OffsetDateTime resolvedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "resolved_by")
    private User resolvedBy;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = OffsetDateTime.now();
        if (updatedAt == null) updatedAt = OffsetDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = OffsetDateTime.now();
    }

    // Getters and Setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
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
    public UUID getDetectionRuleId() { return detectionRuleId; }
    public void setDetectionRuleId(UUID detectionRuleId) { this.detectionRuleId = detectionRuleId; }
    public SecurityEvent getTriggerEvent() { return triggerEvent; }
    public void setTriggerEvent(SecurityEvent triggerEvent) { this.triggerEvent = triggerEvent; }
    public CloudAccount getCloudAccount() { return cloudAccount; }
    public void setCloudAccount(CloudAccount cloudAccount) { this.cloudAccount = cloudAccount; }
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
    public User getAssignedTo() { return assignedTo; }
    public void setAssignedTo(User assignedTo) { this.assignedTo = assignedTo; }
    public OffsetDateTime getResolvedAt() { return resolvedAt; }
    public void setResolvedAt(OffsetDateTime resolvedAt) { this.resolvedAt = resolvedAt; }
    public User getResolvedBy() { return resolvedBy; }
    public void setResolvedBy(User resolvedBy) { this.resolvedBy = resolvedBy; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
    public OffsetDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(OffsetDateTime updatedAt) { this.updatedAt = updatedAt; }
}
