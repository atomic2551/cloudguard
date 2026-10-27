package com.cloudguard.cloud.dto;

public class CloudAccountDto {
    private String id;
    private String name;
    private String provider;
    private String accountId;
    private String externalId;
    private String roleArn;
    private String primaryRegion;
    private String monitoredRegions;
    private String status;
    private String lastSyncAt;
    private String syncError;
    private String createdAt;
    private String updatedAt;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getProvider() { return provider; }
    public void setProvider(String provider) { this.provider = provider; }
    public String getAccountId() { return accountId; }
    public void setAccountId(String accountId) { this.accountId = accountId; }
    public String getExternalId() { return externalId; }
    public void setExternalId(String externalId) { this.externalId = externalId; }
    public String getRoleArn() { return roleArn; }
    public void setRoleArn(String roleArn) { this.roleArn = roleArn; }
    public String getPrimaryRegion() { return primaryRegion; }
    public void setPrimaryRegion(String primaryRegion) { this.primaryRegion = primaryRegion; }
    public String getMonitoredRegions() { return monitoredRegions; }
    public void setMonitoredRegions(String monitoredRegions) { this.monitoredRegions = monitoredRegions; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getLastSyncAt() { return lastSyncAt; }
    public void setLastSyncAt(String lastSyncAt) { this.lastSyncAt = lastSyncAt; }
    public String getSyncError() { return syncError; }
    public void setSyncError(String syncError) { this.syncError = syncError; }
    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }
    public String getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(String updatedAt) { this.updatedAt = updatedAt; }
}
