package com.cloudguard.cloud.dto;

import jakarta.validation.constraints.NotBlank;

public class CreateCloudAccountDto {
    @NotBlank(message = "Name cannot be blank")
    private String name;

    private String provider = "AWS";

    @NotBlank(message = "Account ID cannot be blank")
    private String accountId;

    private String roleArn;
    private String primaryRegion = "us-east-1";
    private String monitoredRegions;

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getProvider() { return provider; }
    public void setProvider(String provider) { this.provider = provider; }
    public String getAccountId() { return accountId; }
    public void setAccountId(String accountId) { this.accountId = accountId; }
    public String getRoleArn() { return roleArn; }
    public void setRoleArn(String roleArn) { this.roleArn = roleArn; }
    public String getPrimaryRegion() { return primaryRegion; }
    public void setPrimaryRegion(String primaryRegion) { this.primaryRegion = primaryRegion; }
    public String getMonitoredRegions() { return monitoredRegions; }
    public void setMonitoredRegions(String monitoredRegions) { this.monitoredRegions = monitoredRegions; }
}
