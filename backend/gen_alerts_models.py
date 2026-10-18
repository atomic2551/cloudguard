import os

# Create Alert DTOs
dtos = """package com.cloudguard.alert.dto;

import com.cloudguard.common.dto.AlertSeverity;
import java.time.OffsetDateTime;
import java.util.UUID;

public record AlertDto(
    UUID id,
    String alertNumber,
    String title,
    String description,
    AlertSeverity severity,
    String status,
    String source,
    UUID detectionRuleId,
    UUID triggerEventId,
    UUID cloudAccountId,
    String sourceIp,
    String userIdentity,
    String targetResource,
    String region,
    String mitreTechniqueId,
    String mitreTactic,
    UUID assignedTo,
    String assignedToName,
    OffsetDateTime resolvedAt,
    UUID resolvedBy,
    OffsetDateTime createdAt,
    OffsetDateTime updatedAt
) {}
"""

update_dto = """package com.cloudguard.alert.dto;

public record UpdateAlertStatusDto(
    String status,
    String comment
) {}
"""

alert_comment_ent = """package com.cloudguard.alert.entity;

import com.cloudguard.user.entity.User;
import jakarta.persistence.*;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "alert_comments")
public class AlertComment {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "alert_id", nullable = false)
    private Alert alert;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_id")
    private User author;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String content;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = OffsetDateTime.now();
    }

    // Getters / Setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public Alert getAlert() { return alert; }
    public void setAlert(Alert alert) { this.alert = alert; }
    public User getAuthor() { return author; }
    public void setAuthor(User author) { this.author = author; }
    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
}
"""

alert_timeline_ent = """package com.cloudguard.alert.entity;

import jakarta.persistence.*;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "alert_timeline")
public class AlertTimeline {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "alert_id", nullable = false)
    private Alert alert;

    @Column(name = "event_time", nullable = false)
    private OffsetDateTime eventTime;

    @Column(name = "event_type", nullable = false, length = 50)
    private String eventType;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String description;

    @Column(length = 20)
    private String severity;

    @Column(length = 200)
    private String actor;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = OffsetDateTime.now();
    }

    // Getters / Setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public Alert getAlert() { return alert; }
    public void setAlert(Alert alert) { this.alert = alert; }
    public OffsetDateTime getEventTime() { return eventTime; }
    public void setEventTime(OffsetDateTime eventTime) { this.eventTime = eventTime; }
    public String getEventType() { return eventType; }
    public void setEventType(String eventType) { this.eventType = eventType; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getSeverity() { return severity; }
    public void setSeverity(String severity) { this.severity = severity; }
    public String getActor() { return actor; }
    public void setActor(String actor) { this.actor = actor; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
}
"""

alert_comment_dto = """package com.cloudguard.alert.dto;
import java.time.OffsetDateTime;
import java.util.UUID;
public record AlertCommentDto(UUID id, UUID alertId, UUID authorId, String authorName, String content, OffsetDateTime createdAt) {}
"""

alert_timeline_dto = """package com.cloudguard.alert.dto;
import java.time.OffsetDateTime;
import java.util.UUID;
public record AlertTimelineDto(UUID id, UUID alertId, OffsetDateTime eventTime, String eventType, String description, String severity, String actor, OffsetDateTime createdAt) {}
"""

alert_detail_dto = """package com.cloudguard.alert.dto;
import java.util.List;
public record AlertDetailDto(
    AlertDto alert,
    List<AlertCommentDto> comments,
    List<AlertTimelineDto> timeline
) {}
"""

# Let's save them
import os

base = "src/main/java/com/cloudguard/alert"
os.makedirs(f"{base}/dto", exist_ok=True)
os.makedirs(f"{base}/entity", exist_ok=True)

with open(f"{base}/dto/AlertDto.java", "w") as f: f.write(dtos)
with open(f"{base}/dto/UpdateAlertStatusDto.java", "w") as f: f.write(update_dto)
with open(f"{base}/dto/AlertCommentDto.java", "w") as f: f.write(alert_comment_dto)
with open(f"{base}/dto/AlertTimelineDto.java", "w") as f: f.write(alert_timeline_dto)
with open(f"{base}/dto/AlertDetailDto.java", "w") as f: f.write(alert_detail_dto)

with open(f"{base}/entity/AlertComment.java", "w") as f: f.write(alert_comment_ent)
with open(f"{base}/entity/AlertTimeline.java", "w") as f: f.write(alert_timeline_ent)

print("Alert Entities and DTOs generated.")
