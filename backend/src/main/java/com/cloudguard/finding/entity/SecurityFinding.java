package com.cloudguard.finding.entity;

import com.cloudguard.cloud.entity.CloudAccount;
import com.cloudguard.user.entity.User;
import jakarta.persistence.*;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import org.hibernate.annotations.Generated;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "security_findings")
public class SecurityFinding {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "finding_number", updatable = false, insertable = false, nullable = false)
    @Generated
    private String findingNumber;

    @Column(nullable = false, length = 500)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false, length = 20)
    private String severity;

    @Column(nullable = false, length = 30)
    private String category;

    @Column(nullable = false, length = 20)
    private String status = "OPEN";

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cloud_account_id", nullable = false)
    private CloudAccount cloudAccount;

    @Column(name = "resource_id", nullable = false, length = 500)
    private String resourceId;

    @Column(length = 30)
    private String region;

    @Column(columnDefinition = "TEXT")
    private String recommendation;

    @Column(name = "risk_score", nullable = false)
    private Integer riskScore;

    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(name = "compliance_frameworks", columnDefinition = "text[]")
    private List<String> complianceFrameworks;

    @Column(name = "detected_at", nullable = false)
    private OffsetDateTime detectedAt;

    @Column(name = "remediated_at")
    private OffsetDateTime remediatedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "suppressed_by")
    private User suppressedBy;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = OffsetDateTime.now();
        if (updatedAt == null) updatedAt = OffsetDateTime.now();
        if (detectedAt == null) detectedAt = OffsetDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = OffsetDateTime.now();
    }

    // Getters and Setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
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
    public CloudAccount getCloudAccount() { return cloudAccount; }
    public void setCloudAccount(CloudAccount cloudAccount) { this.cloudAccount = cloudAccount; }
    public String getResourceId() { return resourceId; }
    public void setResourceId(String resourceId) { this.resourceId = resourceId; }
    public String getRegion() { return region; }
    public void setRegion(String region) { this.region = region; }
    public String getRecommendation() { return recommendation; }
    public void setRecommendation(String recommendation) { this.recommendation = recommendation; }
    public Integer getRiskScore() { return riskScore; }
    public void setRiskScore(Integer riskScore) { this.riskScore = riskScore; }
    public List<String> getComplianceFrameworks() { return complianceFrameworks; }
    public void setComplianceFrameworks(List<String> complianceFrameworks) { this.complianceFrameworks = complianceFrameworks; }
    public OffsetDateTime getDetectedAt() { return detectedAt; }
    public void setDetectedAt(OffsetDateTime detectedAt) { this.detectedAt = detectedAt; }
    public OffsetDateTime getRemediatedAt() { return remediatedAt; }
    public void setRemediatedAt(OffsetDateTime remediatedAt) { this.remediatedAt = remediatedAt; }
    public User getSuppressedBy() { return suppressedBy; }
    public void setSuppressedBy(User suppressedBy) { this.suppressedBy = suppressedBy; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
    public OffsetDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(OffsetDateTime updatedAt) { this.updatedAt = updatedAt; }
}
