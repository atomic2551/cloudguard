package com.cloudguard.finding.controller;

import com.cloudguard.common.dto.PaginatedResponse;
import com.cloudguard.common.response.ApiResponse;
import com.cloudguard.finding.dto.SecurityFindingDto;
import com.cloudguard.finding.dto.UpdateFindingStatusDto;
import com.cloudguard.finding.service.SecurityFindingService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/scanner/findings")
public class FindingController {

    private final SecurityFindingService findingService;

    public FindingController(SecurityFindingService findingService) {
        this.findingService = findingService;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('findings:read')")
    public PaginatedResponse<SecurityFindingDto> getFindings(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String severity,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String status) {
        return findingService.getFindings(page, size, severity, category, status);
    }

    @PatchMapping("/{idOrNumber}/status")
    @PreAuthorize("hasAuthority('findings:write')")
    public ResponseEntity<Map<String, SecurityFindingDto>> updateFindingStatus(
            @PathVariable String idOrNumber, 
            @Valid @RequestBody UpdateFindingStatusDto updateDto) {
        SecurityFindingDto finding = findingService.updateFindingStatus(idOrNumber, updateDto);
        return ResponseEntity.ok(ApiResponse.success(finding));
    }
}
