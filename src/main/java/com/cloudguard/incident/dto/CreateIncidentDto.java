package com.cloudguard.incident.dto;
import com.cloudguard.common.dto.AlertSeverity;
import java.util.List;
import java.util.UUID;
public record CreateIncidentDto(String title, String description, AlertSeverity severity, String category, List<UUID> alertIds, UUID assignedTo) {}
