package com.cloudguard.incident.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.List;
import java.util.UUID;

public class CreateIncidentDto {

    @NotBlank
    private String title;

    private String description;

    @NotNull
    private String severity;

    private String category;
    private List<UUID> alertIds;
    private String assignedTo;

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getSeverity() { return severity; }
    public void setSeverity(String severity) { this.severity = severity; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public List<UUID> getAlertIds() { return alertIds; }
    public void setAlertIds(List<UUID> alertIds) { this.alertIds = alertIds; }
    public String getAssignedTo() { return assignedTo; }
    public void setAssignedTo(String assignedTo) { this.assignedTo = assignedTo; }
}
