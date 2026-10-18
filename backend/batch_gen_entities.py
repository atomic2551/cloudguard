import os

base = "src/main/java/com/cloudguard"

files = {}

# ======== INCIDENT ==========================================
files["incident/entity/IncidentAlertId.java"] = """package com.cloudguard.incident.entity;
import jakarta.persistence.Embeddable;
import java.io.Serializable;
import java.util.Objects;
import java.util.UUID;

@Embeddable
public class IncidentAlertId implements Serializable {
    private UUID incidentId;
    private UUID alertId;

    public IncidentAlertId() {}
    public IncidentAlertId(UUID incidentId, UUID alertId) {
        this.incidentId = incidentId;
        this.alertId = alertId;
    }

    public UUID getIncidentId() { return incidentId; }
    public void setIncidentId(UUID incidentId) { this.incidentId = incidentId; }
    public UUID getAlertId() { return alertId; }
    public void setAlertId(UUID alertId) { this.alertId = alertId; }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        IncidentAlertId that = (IncidentAlertId) o;
        return Objects.equals(incidentId, that.incidentId) && Objects.equals(alertId, that.alertId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(incidentId, alertId);
    }
}
"""

files["incident/entity/IncidentAlert.java"] = """package com.cloudguard.incident.entity;

import com.cloudguard.alert.entity.Alert;
import com.cloudguard.user.entity.User;
import jakarta.persistence.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "incident_alerts")
public class IncidentAlert {
    @EmbeddedId
    private IncidentAlertId id;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("incidentId")
    @JoinColumn(name = "incident_id")
    private Incident incident;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("alertId")
    @JoinColumn(name = "alert_id")
    private Alert alert;

    @Column(name = "linked_at", nullable = false, updatable = false)
    private OffsetDateTime linkedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "linked_by")
    private User linkedBy;

    @PrePersist
    protected void onCreate() {
        if (linkedAt == null) linkedAt = OffsetDateTime.now();
    }

    // Getters and setters
    public IncidentAlertId getId() { return id; }
    public void setId(IncidentAlertId id) { this.id = id; }
    public Incident getIncident() { return incident; }
    public void setIncident(Incident incident) { this.incident = incident; }
    public Alert getAlert() { return alert; }
    public void setAlert(Alert alert) { this.alert = alert; }
    public OffsetDateTime getLinkedAt() { return linkedAt; }
    public void setLinkedAt(OffsetDateTime linkedAt) { this.linkedAt = linkedAt; }
    public User getLinkedBy() { return linkedBy; }
    public void setLinkedBy(User linkedBy) { this.linkedBy = linkedBy; }
}
"""

files["incident/entity/IncidentTimeline.java"] = """package com.cloudguard.incident.entity;

import jakarta.persistence.*;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "incident_timeline")
public class IncidentTimeline {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "incident_id", nullable = false)
    private Incident incident;

    @Column(name = "event_time", nullable = false)
    private OffsetDateTime eventTime;

    @Column(name = "event_type", nullable = false, length = 50)
    private String eventType;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String description;

    @Column(length = 200)
    private String actor;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = OffsetDateTime.now();
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public Incident getIncident() { return incident; }
    public void setIncident(Incident incident) { this.incident = incident; }
    public OffsetDateTime getEventTime() { return eventTime; }
    public void setEventTime(OffsetDateTime eventTime) { this.eventTime = eventTime; }
    public String getEventType() { return eventType; }
    public void setEventType(String eventType) { this.eventType = eventType; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getActor() { return actor; }
    public void setActor(String actor) { this.actor = actor; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
}
"""

files["incident/entity/IncidentNote.java"] = """package com.cloudguard.incident.entity;

import com.cloudguard.user.entity.User;
import jakarta.persistence.*;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "incident_notes")
public class IncidentNote {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "incident_id", nullable = false)
    private Incident incident;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_id")
    private User author;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String content;

    @Column(name = "is_private", nullable = false)
    private boolean isPrivate;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = OffsetDateTime.now();
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public Incident getIncident() { return incident; }
    public void setIncident(Incident incident) { this.incident = incident; }
    public User getAuthor() { return author; }
    public void setAuthor(User author) { this.author = author; }
    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
    public boolean isPrivate() { return isPrivate; }
    public void setPrivate(boolean aPrivate) { isPrivate = aPrivate; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
}
"""

files["incident/dto/IncidentDto.java"] = """package com.cloudguard.incident.dto;

import com.cloudguard.alert.dto.AlertDto;
import com.cloudguard.common.dto.AlertSeverity;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public record IncidentDto(
    UUID id,
    String incidentNumber,
    String title,
    String description,
    AlertSeverity severity,
    String status,
    String category,
    UUID assignedTo,
    String assignedToName,
    UUID createdBy,
    String createdByName,
    OffsetDateTime resolvedAt,
    OffsetDateTime closedAt,
    OffsetDateTime createdAt,
    OffsetDateTime updatedAt,
    Integer alertCount,
    List<AlertDto> alerts
) {}
"""

files["incident/dto/CreateIncidentDto.java"] = """package com.cloudguard.incident.dto;
import com.cloudguard.common.dto.AlertSeverity;
import java.util.List;
import java.util.UUID;
public record CreateIncidentDto(String title, String description, AlertSeverity severity, String category, List<UUID> alertIds, UUID assignedTo) {}
"""

files["incident/dto/UpdateIncidentDto.java"] = """package com.cloudguard.incident.dto;
import com.cloudguard.common.dto.AlertSeverity;
import java.util.UUID;
public record UpdateIncidentDto(String title, String description, AlertSeverity severity, String status, String category, UUID assignedTo) {}
"""

files["incident/dto/IncidentTimelineDto.java"] = """package com.cloudguard.incident.dto;
import java.time.OffsetDateTime;
import java.util.UUID;
public record IncidentTimelineDto(UUID id, UUID incidentId, OffsetDateTime eventTime, String eventType, String description, String actor, OffsetDateTime createdAt) {}
"""

files["incident/dto/IncidentNoteDto.java"] = """package com.cloudguard.incident.dto;
import java.time.OffsetDateTime;
import java.util.UUID;
public record IncidentNoteDto(UUID id, UUID incidentId, UUID authorId, String authorName, String content, boolean isPrivate, OffsetDateTime createdAt) {}
"""

files["incident/dto/IncidentDetailDto.java"] = """package com.cloudguard.incident.dto;
import java.util.List;
public record IncidentDetailDto(
    IncidentDto incident,
    List<IncidentNoteDto> notes,
    List<IncidentTimelineDto> timeline
) {}
"""

# ======== EVENT & FINDING DTO ==========================================

files["event/dto/SecurityEventDto.java"] = """package com.cloudguard.event.dto;
import com.cloudguard.common.dto.AlertSeverity;
import java.time.OffsetDateTime;
import java.util.Map;
import java.util.UUID;
public record SecurityEventDto(UUID id, UUID rawLogId, UUID cloudAccountId, String cloudAccountName, OffsetDateTime eventTime, String eventType, String eventSource, String sourceIp, String userIdentity, String targetResource, String region, String severity, Object requestParameters, Object responseElements, boolean isError, String errorCode, String errorMessage, boolean processedByEngine, OffsetDateTime createdAt) {}
"""

files["event/dto/RawLogDto.java"] = """package com.cloudguard.event.dto;
import java.time.OffsetDateTime;
import java.util.UUID;
public record RawLogDto(UUID id, UUID cloudAccountId, String source, OffsetDateTime receivedAt, Object rawPayload, String payloadHash, boolean processed, OffsetDateTime processedAt, String processingError) {}
"""

files["finding/dto/SecurityFindingDto.java"] = """package com.cloudguard.finding.dto;
import com.cloudguard.common.dto.AlertSeverity;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
public record SecurityFindingDto(UUID id, String findingNumber, String title, String description, AlertSeverity severity, String category, String status, UUID cloudAccountId, String resourceId, String region, String recommendation, Integer riskScore, List<String> complianceFrameworks, OffsetDateTime detectedAt, OffsetDateTime remediatedAt, UUID suppressedBy, OffsetDateTime createdAt, OffsetDateTime updatedAt) {}
"""

files["finding/dto/IamFindingDto.java"] = """package com.cloudguard.finding.dto;
import com.cloudguard.common.dto.AlertSeverity;
import java.time.OffsetDateTime;
import java.util.UUID;
public record IamFindingDto(UUID id, String findingNumber, String title, String description, AlertSeverity severity, String category, String status, UUID cloudAccountId, String affectedPrincipal, String principalType, String recommendation, OffsetDateTime detectedAt, OffsetDateTime remediatedAt, OffsetDateTime createdAt, OffsetDateTime updatedAt) {}
"""

files["finding/dto/UpdateFindingStatusDto.java"] = """package com.cloudguard.finding.dto;
public record UpdateFindingStatusDto(String status) {}
"""

# ======== DASHBOARD ==========================================

files["dashboard/dto/DashboardSummaryDto.java"] = """package com.cloudguard.dashboard.dto;
import java.util.List;
import java.util.Map;
import com.cloudguard.common.dto.AlertSeverity;

public record DashboardSummaryDto(
    Integer overallSecurityScore,
    Map<String, Integer> categoryScores,
    Metrics metrics,
    List<AlertTrend> alertsTrend,
    List<SeverityDistribution> severityDistribution,
    List<Recommendation> topRecommendations
) {
    public record Metrics(Long totalAlerts, Long criticalAlerts, Long highAlerts, Long openIncidents, Long investigatingIncidents, Long criticalFindings, Long openFindings, Long activeCloudAccounts) {}
    public record AlertTrend(String date, Long critical, Long high, Long medium, Long low) {}
    public record SeverityDistribution(String name, Long value, String color) {}
    public record Recommendation(AlertSeverity priority, String text, String effort) {}
}
"""

# ======== CLOUD ACCOUNT ======================================

files["cloud/dto/CloudAccountDto.java"] = """package com.cloudguard.cloud.dto;
import java.time.OffsetDateTime;
import java.util.UUID;
public record CloudAccountDto(UUID id, String name, String provider, String accountId, String externalId, String roleArn, String primaryRegion, String monitoredRegions, String status, OffsetDateTime lastSyncAt, String syncError, OffsetDateTime createdAt, OffsetDateTime updatedAt) {}
"""

for path, content in files.items():
    full_path = os.path.join(base, path)
    os.makedirs(os.path.dirname(full_path), exist_ok=True)
    with open(full_path, "w") as f:
        f.write(content)

print("Batch generated Incident, Event, Finding, CloudAccount, Dashboard DTOs and Incident entities.")
