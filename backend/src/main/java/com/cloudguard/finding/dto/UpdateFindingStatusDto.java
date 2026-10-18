package com.cloudguard.finding.dto;

import jakarta.validation.constraints.NotBlank;

public class UpdateFindingStatusDto {

    @NotBlank
    private String status;

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
