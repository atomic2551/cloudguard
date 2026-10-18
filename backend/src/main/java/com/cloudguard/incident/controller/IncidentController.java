package com.cloudguard.incident.controller;

import com.cloudguard.common.dto.PaginatedResponse;
import com.cloudguard.common.response.ApiResponse;
import com.cloudguard.incident.dto.CreateIncidentDto;
import com.cloudguard.incident.dto.IncidentDto;
import com.cloudguard.incident.dto.IncidentNoteDto;
import com.cloudguard.incident.dto.IncidentTimelineDto;
import com.cloudguard.incident.dto.UpdateIncidentDto;
import com.cloudguard.incident.service.IncidentService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/incidents")
public class IncidentController {

    private final IncidentService incidentService;

    public IncidentController(IncidentService incidentService) {
        this.incidentService = incidentService;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('incidents:read')")
    public PaginatedResponse<IncidentDto> getIncidents(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String severity,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search) {
        return incidentService.getIncidents(page, size, severity, status, search);
    }

    @GetMapping("/{idOrNumber}")
    @PreAuthorize("hasAuthority('incidents:read')")
    public ResponseEntity<Map<String, IncidentDto>> getIncident(@PathVariable String idOrNumber) {
        IncidentDto incident = incidentService.getIncidentByIdOrNumber(idOrNumber);
        return ResponseEntity.ok(ApiResponse.success(incident));
    }

    @GetMapping("/{idOrNumber}/notes")
    @PreAuthorize("hasAuthority('incidents:read')")
    public ResponseEntity<Map<String, List<IncidentNoteDto>>> getIncidentNotes(@PathVariable String idOrNumber) {
        List<IncidentNoteDto> notes = incidentService.getIncidentNotes(idOrNumber);
        return ResponseEntity.ok(ApiResponse.success(notes));
    }

    @GetMapping("/{idOrNumber}/timeline")
    @PreAuthorize("hasAuthority('incidents:read')")
    public ResponseEntity<Map<String, List<IncidentTimelineDto>>> getIncidentTimeline(@PathVariable String idOrNumber) {
        List<IncidentTimelineDto> timeline = incidentService.getIncidentTimeline(idOrNumber);
        return ResponseEntity.ok(ApiResponse.success(timeline));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('incidents:write')")
    public ResponseEntity<Map<String, IncidentDto>> createIncident(
            @Valid @RequestBody CreateIncidentDto createDto,
            Authentication authentication) {
        String username = authentication != null ? authentication.getName() : "System";
        IncidentDto incident = incidentService.createIncident(createDto, username);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(incident));
    }

    @PatchMapping("/{idOrNumber}")
    @PreAuthorize("hasAuthority('incidents:write')")
    public ResponseEntity<Map<String, IncidentDto>> updateIncident(
            @PathVariable String idOrNumber, 
            @Valid @RequestBody UpdateIncidentDto updateDto,
            Authentication authentication) {
        String username = authentication != null ? authentication.getName() : "System";
        IncidentDto incident = incidentService.updateIncident(idOrNumber, updateDto, username);
        return ResponseEntity.ok(ApiResponse.success(incident));
    }
}
