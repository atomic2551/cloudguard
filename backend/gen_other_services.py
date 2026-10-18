import os

# ========= EVENT ========
base_event = "src/main/java/com/cloudguard/event"

reps = """package com.cloudguard.event.repository;
import com.cloudguard.event.entity.SecurityEvent;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.UUID;

@Repository
public interface SecurityEventRepository extends JpaRepository<SecurityEvent, UUID> {
    @Query("SELECT e FROM SecurityEvent e WHERE " +
           "(:severity IS NULL OR e.severity = :severity)")
    Page<SecurityEvent> findByFilters(@Param("severity") String severity, Pageable pageable);
}
"""

mapper = """package com.cloudguard.event.mapper;

import com.cloudguard.event.dto.SecurityEventDto;
import com.cloudguard.event.entity.SecurityEvent;
import com.cloudguard.common.dto.AlertSeverity;

public class SecurityEventMapper {
    public static SecurityEventDto toDto(SecurityEvent event) {
        if (event == null) return null;
        return new SecurityEventDto(
            event.getId(),
            null, // rawLogId
            event.getCloudAccount() != null ? event.getCloudAccount().getId() : null,
            event.getCloudAccount() != null ? event.getCloudAccount().getName() : null,
            event.getEventTime(),
            event.getEventType(),
            event.getEventSource(),
            event.getSourceIp(),
            event.getUserIdentity(),
            event.getTargetResource(),
            event.getRegion(),
            event.getSeverity(),
            null, // requestParameters
            null, // responseElements
            event.isError(),
            event.getErrorCode(),
            event.getErrorMessage(),
            event.isProcessedByEngine(),
            event.getCreatedAt()
        );
    }
}
"""

service = """package com.cloudguard.event.service;
import com.cloudguard.event.dto.SecurityEventDto;
import com.cloudguard.event.mapper.SecurityEventMapper;
import com.cloudguard.event.repository.SecurityEventRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.UUID;

@Service
public class SecurityEventService {
    private final SecurityEventRepository eventRepository;

    public SecurityEventService(SecurityEventRepository eventRepository) {
        this.eventRepository = eventRepository;
    }

    @Transactional(readOnly = true)
    public Page<SecurityEventDto> getEvents(String severity, Pageable pageable) {
        return eventRepository.findByFilters(severity, pageable).map(SecurityEventMapper::toDto);
    }
}
"""

controller = """package com.cloudguard.event.controller;
import com.cloudguard.event.dto.SecurityEventDto;
import com.cloudguard.event.service.SecurityEventService;
import com.cloudguard.common.dto.PaginatedResponse;
import com.cloudguard.common.response.ApiResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.time.OffsetDateTime;

@RestController
@RequestMapping("/api/v1/events")
public class SecurityEventController {
    private final SecurityEventService eventService;

    public SecurityEventController(SecurityEventService eventService) {
        this.eventService = eventService;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('events:read')")
    public ApiResponse<PaginatedResponse<SecurityEventDto>> getEvents(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size,
            @RequestParam(required = false) String severity) {
        Page<SecurityEventDto> pageData = eventService.getEvents(severity, PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "eventTime")));
        return new ApiResponse<>(true, new PaginatedResponse<>(
                pageData.getContent(), pageData.getNumber(), pageData.getSize(), pageData.getTotalElements(), pageData.getTotalPages()
        ), "Events retrieved successfully", OffsetDateTime.now().toString());
    }
}
"""

os.makedirs(f"{base_event}/repository", exist_ok=True)
os.makedirs(f"{base_event}/mapper", exist_ok=True)
os.makedirs(f"{base_event}/service", exist_ok=True)
os.makedirs(f"{base_event}/controller", exist_ok=True)
with open(f"{base_event}/repository/SecurityEventRepository.java", "w") as f: f.write(reps)
with open(f"{base_event}/mapper/SecurityEventMapper.java", "w") as f: f.write(mapper)
with open(f"{base_event}/service/SecurityEventService.java", "w") as f: f.write(service)
with open(f"{base_event}/controller/SecurityEventController.java", "w") as f: f.write(controller)


# ========= FINDING ========
base_finding = "src/main/java/com/cloudguard/finding"
rep_f1 = """package com.cloudguard.finding.repository;
import com.cloudguard.finding.entity.SecurityFinding;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.UUID;

@Repository
public interface SecurityFindingRepository extends JpaRepository<SecurityFinding, UUID> {
    @Query("SELECT f FROM SecurityFinding f WHERE (:severity IS NULL OR f.severity = :severity) AND (:status IS NULL OR f.status = :status)")
    Page<SecurityFinding> findByFilters(@Param("severity") String severity, @Param("status") String status, Pageable pageable);
}
"""
rep_f2 = """package com.cloudguard.finding.repository;
import com.cloudguard.finding.entity.IamFinding;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.UUID;

@Repository
public interface IamFindingRepository extends JpaRepository<IamFinding, UUID> {
    @Query("SELECT f FROM IamFinding f WHERE (:severity IS NULL OR f.severity = :severity) AND (:status IS NULL OR f.status = :status)")
    Page<IamFinding> findByFilters(@Param("severity") String severity, @Param("status") String status, Pageable pageable);
}
"""
mapper_f = """package com.cloudguard.finding.mapper;
import com.cloudguard.finding.dto.IamFindingDto;
import com.cloudguard.finding.dto.SecurityFindingDto;
import com.cloudguard.finding.entity.IamFinding;
import com.cloudguard.finding.entity.SecurityFinding;
import com.cloudguard.common.dto.AlertSeverity;

public class FindingMapper {
    public static SecurityFindingDto toDto(SecurityFinding f) {
        if (f == null) return null;
        return new SecurityFindingDto(f.getId(), f.getFindingNumber(), f.getTitle(), f.getDescription(), AlertSeverity.valueOf(f.getSeverity()), f.getCategory(), f.getStatus(), f.getCloudAccount() != null ? f.getCloudAccount().getId() : null, f.getResourceId(), f.getRegion(), f.getRecommendation(), f.getRiskScore(), null, f.getDetectedAt(), f.getRemediatedAt(), f.getSuppressedBy() != null ? f.getSuppressedBy().getId() : null, f.getCreatedAt(), f.getUpdatedAt());
    }
    public static IamFindingDto toDto(IamFinding f) {
        if (f == null) return null;
        return new IamFindingDto(f.getId(), f.getFindingNumber(), f.getTitle(), f.getDescription(), AlertSeverity.valueOf(f.getSeverity()), f.getCategory(), f.getStatus(), f.getCloudAccount() != null ? f.getCloudAccount().getId() : null, f.getAffectedPrincipal(), f.getPrincipalType(), f.getRecommendation(), f.getDetectedAt(), f.getRemediatedAt(), f.getCreatedAt(), f.getUpdatedAt());
    }
}
"""
service_f = """package com.cloudguard.finding.service;
import com.cloudguard.finding.dto.IamFindingDto;
import com.cloudguard.finding.dto.SecurityFindingDto;
import com.cloudguard.finding.mapper.FindingMapper;
import com.cloudguard.finding.repository.IamFindingRepository;
import com.cloudguard.finding.repository.SecurityFindingRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class FindingService {
    private final SecurityFindingRepository secFindingRepository;
    private final IamFindingRepository iamFindingRepository;
    public FindingService(SecurityFindingRepository secFindingRepository, IamFindingRepository iamFindingRepository) {
        this.secFindingRepository = secFindingRepository;
        this.iamFindingRepository = iamFindingRepository;
    }
    
    @Transactional(readOnly = true)
    public Page<SecurityFindingDto> getScannerFindings(String severity, String status, Pageable pageable) {
        return secFindingRepository.findByFilters(severity, status, pageable).map(FindingMapper::toDto);
    }

    @Transactional(readOnly = true)
    public Page<IamFindingDto> getIamFindings(String severity, String status, Pageable pageable) {
        return iamFindingRepository.findByFilters(severity, status, pageable).map(FindingMapper::toDto);
    }
}
"""
controller_f1 = """package com.cloudguard.finding.controller;
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
"""
controller_f2 = """package com.cloudguard.finding.controller;
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
"""

os.makedirs(f"{base_finding}/repository", exist_ok=True)
os.makedirs(f"{base_finding}/mapper", exist_ok=True)
os.makedirs(f"{base_finding}/service", exist_ok=True)
os.makedirs(f"{base_finding}/controller", exist_ok=True)
with open(f"{base_finding}/repository/SecurityFindingRepository.java", "w") as f: f.write(rep_f1)
with open(f"{base_finding}/repository/IamFindingRepository.java", "w") as f: f.write(rep_f2)
with open(f"{base_finding}/mapper/FindingMapper.java", "w") as f: f.write(mapper_f)
with open(f"{base_finding}/service/FindingService.java", "w") as f: f.write(service_f)
with open(f"{base_finding}/controller/ScannerFindingController.java", "w") as f: f.write(controller_f1)
with open(f"{base_finding}/controller/IamFindingController.java", "w") as f: f.write(controller_f2)


# ========= DASHBOARD ========
base_dash = "src/main/java/com/cloudguard/dashboard"
dashboard_ser = """package com.cloudguard.dashboard.service;
import com.cloudguard.dashboard.dto.DashboardSummaryDto;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.Map;
import java.util.List;
import java.util.ArrayList;

@Service
public class DashboardService {
    private final JdbcTemplate jdbcTemplate;
    public DashboardService(JdbcTemplate jdbcTemplate) { this.jdbcTemplate = jdbcTemplate; }

    @Transactional(readOnly = true)
    public DashboardSummaryDto getSummary() {
        Long totalAlerts = jdbcTemplate.queryForObject("SELECT count(*) FROM alerts", Long.class);
        Long critAlerts = jdbcTemplate.queryForObject("SELECT count(*) FROM alerts WHERE severity = 'CRITICAL'", Long.class);
        Long highAlerts = jdbcTemplate.queryForObject("SELECT count(*) FROM alerts WHERE severity = 'HIGH'", Long.class);
        
        Long openIncidents = jdbcTemplate.queryForObject("SELECT count(*) FROM incidents WHERE status = 'OPEN'", Long.class);
        Long invIncidents = jdbcTemplate.queryForObject("SELECT count(*) FROM incidents WHERE status = 'INVESTIGATING'", Long.class);
        
        Long critFindings = jdbcTemplate.queryForObject("SELECT count(*) FROM security_findings WHERE severity = 'CRITICAL' AND status != 'REMEDIATED'", Long.class);
        Long openFindings = jdbcTemplate.queryForObject("SELECT count(*) FROM security_findings WHERE status != 'REMEDIATED'", Long.class);
        
        Long activeCloudAccounts = jdbcTemplate.queryForObject("SELECT count(*) FROM cloud_accounts WHERE status = 'CONNECTED'", Long.class);

        var metrics = new DashboardSummaryDto.Metrics(
            totalAlerts, critAlerts, highAlerts, openIncidents, invIncidents, critFindings, openFindings, activeCloudAccounts
        );
        
        return new DashboardSummaryDto(
            85, // Mock overall score
            Map.of("iam", 90, "network", 80, "storage", 85, "logging", 95, "compute", 75), // Mock category
            metrics,
            new ArrayList<>(), // Return empty lists for trends for now unless explicit SQL added
            new ArrayList<>(),
            new ArrayList<>()
        );
    }
}
"""
dashboard_ctrl = """package com.cloudguard.dashboard.controller;
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
"""

os.makedirs(f"{base_dash}/service", exist_ok=True)
os.makedirs(f"{base_dash}/controller", exist_ok=True)
with open(f"{base_dash}/service/DashboardService.java", "w") as f: f.write(dashboard_ser)
with open(f"{base_dash}/controller/DashboardController.java", "w") as f: f.write(dashboard_ctrl)

print("Event, Finding, Dashboard done.")
