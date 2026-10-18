package com.cloudguard.event.dto;

import java.util.Map;

public class SecurityEventDto {
    private String id;
    private String rawLogId;
    private String cloudAccountId;
    private String cloudAccountName;
    private String eventTime;
    private String eventType;
    private String eventSource;
    private String sourceIp;
    private String userIdentity;
    private String targetResource;
    private String region;
    private String severity;
    private Map<String, Object> requestParameters;
    private Map<String, Object> responseElements;
    private boolean isError;
    private String errorCode;
    private String errorMessage;
    private boolean processedByEngine;
    private String createdAt;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getRawLogId() { return rawLogId; }
    public void setRawLogId(String rawLogId) { this.rawLogId = rawLogId; }
    public String getCloudAccountId() { return cloudAccountId; }
    public void setCloudAccountId(String cloudAccountId) { this.cloudAccountId = cloudAccountId; }
    public String getCloudAccountName() { return cloudAccountName; }
    public void setCloudAccountName(String cloudAccountName) { this.cloudAccountName = cloudAccountName; }
    public String getEventTime() { return eventTime; }
    public void setEventTime(String eventTime) { this.eventTime = eventTime; }
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
    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }
}
