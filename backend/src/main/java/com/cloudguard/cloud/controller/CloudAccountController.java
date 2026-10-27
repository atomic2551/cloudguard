package com.cloudguard.cloud.controller;

import com.cloudguard.cloud.dto.CloudAccountDto;
import com.cloudguard.cloud.dto.CreateCloudAccountDto;
import com.cloudguard.cloud.dto.UpdateCloudAccountDto;
import com.cloudguard.cloud.service.CloudAccountService;
import com.cloudguard.common.dto.PaginatedResponse;
import com.cloudguard.common.response.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/cloud-accounts")
public class CloudAccountController {

    private final CloudAccountService service;

    public CloudAccountController(CloudAccountService service) {
        this.service = service;
    }

    @GetMapping
    @PreAuthorize("hasAnyAuthority('cloud_accounts:read', 'ROLE_ADMIN', 'ROLE_SOC_ANALYST', 'ROLE_VIEWER')")
    public PaginatedResponse<CloudAccountDto> getAccounts(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size) {
        return service.getAccounts(page, size);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('cloud_accounts:read', 'ROLE_ADMIN', 'ROLE_SOC_ANALYST', 'ROLE_VIEWER')")
    public ResponseEntity<Map<String, CloudAccountDto>> getAccountById(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(service.getAccountById(id)));
    }

    @PostMapping
    @PreAuthorize("hasAnyAuthority('cloud_accounts:write', 'ROLE_ADMIN')")
    public ResponseEntity<Map<String, CloudAccountDto>> createAccount(@Valid @RequestBody CreateCloudAccountDto dto) {
        return ResponseEntity.ok(ApiResponse.success(service.createAccount(dto)));
    }

    @PatchMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('cloud_accounts:write', 'ROLE_ADMIN')")
    public ResponseEntity<Map<String, CloudAccountDto>> updateAccount(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateCloudAccountDto dto) {
        return ResponseEntity.ok(ApiResponse.success(service.updateAccount(id, dto)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('cloud_accounts:delete', 'ROLE_ADMIN')")
    public ResponseEntity<Map<String, Boolean>> deleteAccount(@PathVariable UUID id) {
        service.deleteAccount(id);
        return ResponseEntity.ok(Map.of("success", true));
    }
}
