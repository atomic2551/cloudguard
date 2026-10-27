package com.cloudguard.rule.controller;

import com.cloudguard.common.dto.PaginatedResponse;
import com.cloudguard.common.response.ApiResponse;
import com.cloudguard.rule.dto.CreateDetectionRuleDto;
import com.cloudguard.rule.dto.DetectionRuleDto;
import com.cloudguard.rule.dto.UpdateDetectionRuleDto;
import com.cloudguard.rule.service.DetectionRuleService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/detection-rules")
public class DetectionRuleController {

    private final DetectionRuleService service;

    public DetectionRuleController(DetectionRuleService service) {
        this.service = service;
    }

    @GetMapping
    @PreAuthorize("hasAnyAuthority('rules:read', 'ROLE_ADMIN', 'ROLE_SOC_ANALYST', 'ROLE_VIEWER')")
    public PaginatedResponse<DetectionRuleDto> getRules(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size) {
        return service.getRules(page, size);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('rules:read', 'ROLE_ADMIN', 'ROLE_SOC_ANALYST', 'ROLE_VIEWER')")
    public ResponseEntity<Map<String, DetectionRuleDto>> getRuleById(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(service.getRuleById(id)));
    }

    @PostMapping
    @PreAuthorize("hasAnyAuthority('rules:write', 'ROLE_ADMIN')")
    public ResponseEntity<Map<String, DetectionRuleDto>> createRule(
            @Valid @RequestBody CreateDetectionRuleDto dto,
            Authentication authentication) {
        String username = authentication != null ? authentication.getName() : null;
        return ResponseEntity.ok(ApiResponse.success(service.createRule(dto, username)));
    }

    @PatchMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('rules:write', 'ROLE_ADMIN')")
    public ResponseEntity<Map<String, DetectionRuleDto>> updateRule(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateDetectionRuleDto dto) {
        return ResponseEntity.ok(ApiResponse.success(service.updateRule(id, dto)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('rules:delete', 'ROLE_ADMIN')")
    public ResponseEntity<Map<String, Boolean>> deleteRule(@PathVariable UUID id) {
        service.deleteRule(id);
        return ResponseEntity.ok(Map.of("success", true));
    }
}
