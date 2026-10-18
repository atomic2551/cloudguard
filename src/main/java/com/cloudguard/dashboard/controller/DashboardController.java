package com.cloudguard.dashboard.controller;
import com.cloudguard.dashboard.dto.DashboardSummaryDto;
import com.cloudguard.dashboard.service.DashboardService;
import com.cloudguard.common.response.ApiResponse;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.time.OffsetDateTime;

@RestController
@RequestMapping("/api/v1/dashboard")
public class DashboardController {
    private final DashboardService dashboardService;
    public DashboardController(DashboardService dashboardService) { this.dashboardService = dashboardService; }
    
    @GetMapping("/summary")
    @PreAuthorize("hasAuthority('dashboard:read')")
    public ApiResponse<DashboardSummaryDto> getSummary() {
        return new ApiResponse<>(true, dashboardService.getSummary(), "Dashboard summary retrieved", OffsetDateTime.now().toString());
    }
}
