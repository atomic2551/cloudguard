package com.cloudguard.report.controller;

import com.cloudguard.common.response.ApiResponse;
import com.cloudguard.report.dto.SecurityReportDto;
import com.cloudguard.report.service.ReportService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/reports")
public class ReportController {

    private final ReportService reportService;

    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    @GetMapping
    @PreAuthorize("hasAnyAuthority('reports:read', 'ROLE_ADMIN', 'ROLE_SOC_ANALYST', 'ROLE_VIEWER')")
    public ResponseEntity<Map<String, SecurityReportDto>> getReport() {
        return ResponseEntity.ok(ApiResponse.success(reportService.generateLatestReport()));
    }

    @GetMapping("/latest")
    @PreAuthorize("hasAnyAuthority('reports:read', 'ROLE_ADMIN', 'ROLE_SOC_ANALYST', 'ROLE_VIEWER')")
    public ResponseEntity<Map<String, SecurityReportDto>> getLatestReport() {
        return ResponseEntity.ok(ApiResponse.success(reportService.generateLatestReport()));
    }
}
