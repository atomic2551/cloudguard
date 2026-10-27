package com.cloudguard.cloud.dto;

public class UpdateCloudAccountDto {
    private String name;
    private String roleArn;
    private String primaryRegion;
    private String monitoredRegions;
    private String status;

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getRoleArn() { return roleArn; }
    public void setRoleArn(String roleArn) { this.roleArn = roleArn; }
    public String getPrimaryRegion() { return primaryRegion; }
    public void setPrimaryRegion(String primaryRegion) { this.primaryRegion = primaryRegion; }
    public String getMonitoredRegions() { return monitoredRegions; }
    public void setMonitoredRegions(String monitoredRegions) { this.monitoredRegions = monitoredRegions; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
