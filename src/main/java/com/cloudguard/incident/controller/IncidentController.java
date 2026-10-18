package com.cloudguard.incident.controller;

import com.cloudguard.incident.dto.IncidentDetailDto;
import com.cloudguard.incident.dto.IncidentDto;
import com.cloudguard.incident.dto.UpdateIncidentDto;
import com.cloudguard.incident.service.IncidentService;
import com.cloudguard.common.dto.PaginatedResponse;
import com.cloudguard.common.response.ApiResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.OffsetDateTime;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/incidents")
public class IncidentController {
    
    private final IncidentService incidentService;
    
    public IncidentController(IncidentService incidentService) {
        this.incidentService = incidentService;
    }
    
    @GetMapping
    @PreAuthorize("hasAuthority('incidents:read')")
    public ApiResponse<PaginatedResponse<IncidentDto>> getIncidents(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String severity,
            @RequestParam(required = false) String status) {
        Page<IncidentDto> pageData = incidentService.getIncidents(severity, status, PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt")));
        return new ApiResponse<>(true, new PaginatedResponse<>(
                pageData.getContent(),
                pageData.getNumber(),
                pageData.getSize(),
                pageData.getTotalElements(),
                pageData.getTotalPages()
        ), "Incidents retrieved successfully", OffsetDateTime.now().toString());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('incidents:read')")
    public ApiResponse<IncidentDetailDto> getIncidentDetail(@PathVariable UUID id) {
        return new ApiResponse<>(true, incidentService.getIncidentDetail(id),
                "Incident detail retrieved", OffsetDateTime.now().toString());
    }

    @PatchMapping("/{id}")
    @PreAuthorize("hasAuthority('incidents:write')")
    public ApiResponse<IncidentDto> updateIncident(@PathVariable UUID id, @RequestBody UpdateIncidentDto dto, Authentication auth) {
        String username = auth != null ? auth.getName() : null;
        return new ApiResponse<>(true, incidentService.updateStatus(id, dto, username),
                "Incident updated", OffsetDateTime.now().toString());
    }
}
