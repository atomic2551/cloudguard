package com.cloudguard.finding.controller;
import com.cloudguard.finding.dto.IamFindingDto;
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
@RequestMapping("/api/v1/iam/findings")
public class IamFindingController {
    private final FindingService findingService;
    public IamFindingController(FindingService findingService) { this.findingService = findingService; }

    @GetMapping
    @PreAuthorize("hasAuthority('findings:read')")
    public ApiResponse<PaginatedResponse<IamFindingDto>> getIamFindings(@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "20") int size, @RequestParam(required = false) String severity, @RequestParam(required = false) String status) {
        Page<IamFindingDto> pageData = findingService.getIamFindings(severity, status, PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "detectedAt")));
        return new ApiResponse<>(true, new PaginatedResponse<>(pageData.getContent(), pageData.getNumber(), pageData.getSize(), pageData.getTotalElements(), pageData.getTotalPages()), "IAM Findings retrieved", OffsetDateTime.now().toString());
    }
}
