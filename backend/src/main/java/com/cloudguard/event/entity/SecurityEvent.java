package com.cloudguard.event.entity;

import com.cloudguard.cloud.entity.CloudAccount;
import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.time.OffsetDateTime;
import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "security_events")
public class SecurityEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "raw_log_id")
    private UUID rawLogId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cloud_account_id", nullable = false)
    private CloudAccount cloudAccount;

    @Column(name = "event_time", nullable = false)
    private OffsetDateTime eventTime;

    @Column(name = "event_type", nullable = false, length = 100)
    private String eventType;

    @Column(name = "event_source", nullable = false, length = 100)
    private String eventSource;

    @Column(name = "source_ip", length = 45)
    private String sourceIp;

    @Column(name = "user_identity", length = 300)
    private String userIdentity;

    @Column(name = "target_resource", length = 500)
    private String targetResource;

    @Column(length = 30)
    private String region;

    @Column(nullable = false, length = 20)
    private String severity;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "request_parameters", columnDefinition = "jsonb")
    private Map<String, Object> requestParameters;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "response_elements", columnDefinition = "jsonb")
    private Map<String, Object> responseElements;

    @Column(name = "is_error", nullable = false)
    private boolean isError = false;

    @Column(name = "error_code", length = 100)
    private String errorCode;

    @Column(name = "error_message")
    private String errorMessage;

    @Column(name = "processed_by_engine", nullable = false)
    private boolean processedByEngine = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = OffsetDateTime.now();
    }

    // Getters and Setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public UUID getRawLogId() { return rawLogId; }
    public void setRawLogId(UUID rawLogId) { this.rawLogId = rawLogId; }
    public CloudAccount getCloudAccount() { return cloudAccount; }
    public void setCloudAccount(CloudAccount cloudAccount) { this.cloudAccount = cloudAccount; }
    public OffsetDateTime getEventTime() { return eventTime; }
    public void setEventTime(OffsetDateTime eventTime) { this.eventTime = eventTime; }
    public String getEventType() { return eventType; }
    public void setEventType(String eventType) { this.eventType = eventType; }
    public String getEventSource() { return eventSource; }
    public void setEventSource(String eventSource) { this.eventSource = eventSource; }
    public String getSourceIp() { return sourceIp; }
    public void setSourceIp(String sourceIp) { this.sourceIp = sourceIp; }
    public String getUserIdentity() { return userIdentity; }
    public void setUserIdentity(String userIdentity) { this.userIdentity = userIdentity; }
    public String getTargetResource() { return targetResource; }
    public void setTargetResource(String targetResource) { this.targetResource = targetResource; }
    public String getRegion() { return region; }
    public void setRegion(String region) { this.region = region; }
    public String getSeverity() { return severity; }
    public void setSeverity(String severity) { this.severity = severity; }
    public Map<String, Object> getRequestParameters() { return requestParameters; }
    public void setRequestParameters(Map<String, Object> requestParameters) { this.requestParameters = requestParameters; }
    public Map<String, Object> getResponseElements() { return responseElements; }
    public void setResponseElements(Map<String, Object> responseElements) { this.responseElements = responseElements; }
    public boolean isError() { return isError; }
    public void setError(boolean error) { isError = error; }
    public String getErrorCode() { return errorCode; }
    public void setErrorCode(String errorCode) { this.errorCode = errorCode; }
    public String getErrorMessage() { return errorMessage; }
    public void setErrorMessage(String errorMessage) { this.errorMessage = errorMessage; }
    public boolean isProcessedByEngine() { return processedByEngine; }
    public void setProcessedByEngine(boolean processedByEngine) { this.processedByEngine = processedByEngine; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
}
