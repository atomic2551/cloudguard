package com.cloudguard.alert.controller;

import com.cloudguard.alert.dto.AlertDto;
import com.cloudguard.alert.dto.AlertCommentDto;
import com.cloudguard.alert.dto.AlertTimelineDto;
import com.cloudguard.alert.dto.UpdateAlertStatusDto;
import com.cloudguard.alert.service.AlertService;
import com.cloudguard.common.dto.PaginatedResponse;
import com.cloudguard.common.response.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/alerts")
public class AlertController {

    private final AlertService alertService;

    public AlertController(AlertService alertService) {
        this.alertService = alertService;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('alerts:read')")
    public PaginatedResponse<AlertDto> getAlerts(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String severity,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search) {
        return alertService.getAlerts(page, size, severity, status, search);
    }

    @GetMapping("/{idOrNumber}")
    @PreAuthorize("hasAuthority('alerts:read')")
    public ResponseEntity<Map<String, AlertDto>> getAlert(@PathVariable String idOrNumber) {
        AlertDto alert = alertService.getAlertByIdOrNumber(idOrNumber);
        return ResponseEntity.ok(ApiResponse.success(alert));
    }

    @GetMapping("/{idOrNumber}/comments")
    @PreAuthorize("hasAuthority('alerts:read')")
    public ResponseEntity<Map<String, List<AlertCommentDto>>> getAlertComments(@PathVariable String idOrNumber) {
        List<AlertCommentDto> comments = alertService.getAlertComments(idOrNumber);
        return ResponseEntity.ok(ApiResponse.success(comments));
    }

    @GetMapping("/{idOrNumber}/timeline")
    @PreAuthorize("hasAuthority('alerts:read')")
    public ResponseEntity<Map<String, List<AlertTimelineDto>>> getAlertTimeline(@PathVariable String idOrNumber) {
        List<AlertTimelineDto> timeline = alertService.getAlertTimeline(idOrNumber);
        return ResponseEntity.ok(ApiResponse.success(timeline));
    }

    @PatchMapping("/{idOrNumber}/status")
    @PreAuthorize("hasAuthority('alerts:write')")
    public ResponseEntity<Map<String, AlertDto>> updateAlertStatus(
            @PathVariable String idOrNumber, 
            @Valid @RequestBody UpdateAlertStatusDto updateDto,
            Authentication authentication) {
        String username = authentication != null ? authentication.getName() : "System";
        AlertDto alert = alertService.updateAlertStatus(idOrNumber, updateDto, username);
        return ResponseEntity.ok(ApiResponse.success(alert));
    }
}
