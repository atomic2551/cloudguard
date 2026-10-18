package com.cloudguard.incident.dto;
import com.cloudguard.common.dto.AlertSeverity;
import java.util.UUID;
public record UpdateIncidentDto(String title, String description, AlertSeverity severity, String status, String category, UUID assignedTo) {}
