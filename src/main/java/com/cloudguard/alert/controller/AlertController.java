package com.cloudguard.alert.controller;

import com.cloudguard.alert.dto.AlertDetailDto;
import com.cloudguard.alert.dto.AlertDto;
import com.cloudguard.alert.dto.UpdateAlertStatusDto;
import com.cloudguard.alert.service.AlertService;
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
@RequestMapping("/api/v1/alerts")
public class AlertController {
    
    private final AlertService alertService;
    
    public AlertController(AlertService alertService) {
        this.alertService = alertService;
    }
    
    @GetMapping
    @PreAuthorize("hasAuthority('alerts:read')")
    public ApiResponse<PaginatedResponse<AlertDto>> getAlerts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String severity,
            @RequestParam(required = false) String status) {
        Page<AlertDto> alertPage = alertService.getAlerts(severity, status, PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt")));
        return new ApiResponse<>(true, new PaginatedResponse<>(
                alertPage.getContent(),
                alertPage.getNumber(),
                alertPage.getSize(),
                alertPage.getTotalElements(),
                alertPage.getTotalPages()
        ), "Alerts retrieved successfully", OffsetDateTime.now().toString());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('alerts:read')")
    public ApiResponse<AlertDetailDto> getAlertDetail(@PathVariable UUID id) {
        return new ApiResponse<>(true, alertService.getAlertDetail(id),
                "Alert detail retrieved", OffsetDateTime.now().toString());
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAuthority('alerts:write')")
    public ApiResponse<AlertDto> updateStatus(@PathVariable UUID id, @RequestBody UpdateAlertStatusDto dto, Authentication auth) {
        String username = auth != null ? auth.getName() : null;
        return new ApiResponse<>(true, alertService.updateStatus(id, dto, username),
                "Alert status updated", OffsetDateTime.now().toString());
    }
}
