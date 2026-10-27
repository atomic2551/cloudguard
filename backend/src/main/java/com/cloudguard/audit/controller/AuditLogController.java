package com.cloudguard.audit.controller;

import com.cloudguard.audit.dto.AuditLogDto;
import com.cloudguard.audit.service.AuditLogService;
import com.cloudguard.common.dto.PaginatedResponse;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/audit-logs")
public class AuditLogController {

    private final AuditLogService service;

    public AuditLogController(AuditLogService service) {
        this.service = service;
    }

    @GetMapping
    @PreAuthorize("hasAnyAuthority('audit:read', 'ROLE_ADMIN', 'ROLE_SOC_ANALYST')")
    public PaginatedResponse<AuditLogDto> getAuditLogs(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size) {
        return service.getAuditLogs(page, size);
    }
}
