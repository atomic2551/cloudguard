package com.cloudguard.finding.controller;

import com.cloudguard.common.dto.PaginatedResponse;
import com.cloudguard.common.response.ApiResponse;
import com.cloudguard.finding.dto.IamFindingDto;
import com.cloudguard.finding.dto.UpdateFindingStatusDto;
import com.cloudguard.finding.service.IamFindingService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/iam/findings")
public class IamFindingController {

    private final IamFindingService findingService;

    public IamFindingController(IamFindingService findingService) {
        this.findingService = findingService;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('findings:read')")
    public PaginatedResponse<IamFindingDto> getFindings(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String severity,
            @RequestParam(required = false) String status) {
        return findingService.getFindings(page, size, severity, status);
    }

    @PatchMapping("/{idOrNumber}/status")
    @PreAuthorize("hasAuthority('findings:write')")
    public ResponseEntity<Map<String, IamFindingDto>> updateFindingStatus(
            @PathVariable String idOrNumber, 
            @Valid @RequestBody UpdateFindingStatusDto updateDto) {
        IamFindingDto finding = findingService.updateFindingStatus(idOrNumber, updateDto);
        return ResponseEntity.ok(ApiResponse.success(finding));
    }
}
