package com.cloudguard.finding.controller;
import com.cloudguard.finding.dto.SecurityFindingDto;
import com.cloudguard.finding.service.FindingService;
import com.cloudguard.common.dto.PaginatedResponse;
import com.cloudguard.common.response.ApiResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.time.OffsetDateTime;

@RestController
@RequestMapping("/api/v1/scanner/findings")
public class ScannerFindingController {
    private final FindingService findingService;
    public ScannerFindingController(FindingService findingService) { this.findingService = findingService; }

    @GetMapping
    @PreAuthorize("hasAuthority('findings:read')")
    public ApiResponse<PaginatedResponse<SecurityFindingDto>> getScannerFindings(@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "20") int size, @RequestParam(required = false) String severity, @RequestParam(required = false) String status) {
        Page<SecurityFindingDto> pageData = findingService.getScannerFindings(severity, status, PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "detectedAt")));
        return new ApiResponse<>(true, new PaginatedResponse<>(pageData.getContent(), pageData.getNumber(), pageData.getSize(), pageData.getTotalElements(), pageData.getTotalPages()), "Scanner Findings retrieved", OffsetDateTime.now().toString());
    }
}
