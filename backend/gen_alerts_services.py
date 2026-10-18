import os
base = "src/main/java/com/cloudguard/alert"

reps = """package com.cloudguard.alert.repository;
import com.cloudguard.alert.entity.Alert;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.UUID;

@Repository
public interface AlertRepository extends JpaRepository<Alert, UUID> {
    
    @Query("SELECT a FROM Alert a LEFT JOIN FETCH a.assignedTo WHERE " +
           "(:severity IS NULL OR a.severity = :severity) AND " +
           "(:status IS NULL OR a.status = :status)")
    Page<Alert> findByFilters(@Param("severity") String severity, @Param("status") String status, Pageable pageable);
}
"""

rep2 = """package com.cloudguard.alert.repository;
import com.cloudguard.alert.entity.AlertComment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;
@Repository
public interface AlertCommentRepository extends JpaRepository<AlertComment, UUID> {
    List<AlertComment> findByAlertIdOrderByCreatedAtDesc(UUID alertId);
}
"""

rep3 = """package com.cloudguard.alert.repository;
import com.cloudguard.alert.entity.AlertTimeline;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;
@Repository
public interface AlertTimelineRepository extends JpaRepository<AlertTimeline, UUID> {
    List<AlertTimeline> findByAlertIdOrderByEventTimeDesc(UUID alertId);
}
"""

mapper = """package com.cloudguard.alert.mapper;

import com.cloudguard.alert.dto.AlertCommentDto;
import com.cloudguard.alert.dto.AlertDto;
import com.cloudguard.alert.dto.AlertTimelineDto;
import com.cloudguard.alert.entity.Alert;
import com.cloudguard.alert.entity.AlertComment;
import com.cloudguard.alert.entity.AlertTimeline;
import com.cloudguard.common.dto.AlertSeverity;

public class AlertMapper {
    public static AlertDto toDto(Alert alert) {
        if (alert == null) return null;
        return new AlertDto(
            alert.getId(),
            alert.getAlertNumber(),
            alert.getTitle(),
            alert.getDescription(),
            AlertSeverity.valueOf(alert.getSeverity()),
            alert.getStatus(),
            alert.getSource(),
            alert.getDetectionRuleId(),
            alert.getTriggerEvent() != null ? alert.getTriggerEvent().getId() : null,
            alert.getCloudAccount() != null ? alert.getCloudAccount().getId() : null,
            alert.getSourceIp(),
            alert.getUserIdentity(),
            alert.getTargetResource(),
            alert.getRegion(),
            alert.getMitreTechniqueId(),
            alert.getMitreTactic(),
            alert.getAssignedTo() != null ? alert.getAssignedTo().getId() : null,
            alert.getAssignedTo() != null ? alert.getAssignedTo().getDisplayName() : null,
            alert.getResolvedAt(),
            alert.getResolvedBy() != null ? alert.getResolvedBy().getId() : null,
            alert.getCreatedAt(),
            alert.getUpdatedAt()
        );
    }
    
    public static AlertCommentDto toDto(AlertComment comment) {
        if (comment == null) return null;
        return new AlertCommentDto(
            comment.getId(),
            comment.getAlert().getId(),
            comment.getAuthor() != null ? comment.getAuthor().getId() : null,
            comment.getAuthor() != null ? comment.getAuthor().getDisplayName() : "System",
            comment.getContent(),
            comment.getCreatedAt()
        );
    }

    public static AlertTimelineDto toDto(AlertTimeline t) {
        if (t == null) return null;
        return new AlertTimelineDto(
            t.getId(),
            t.getAlert().getId(),
            t.getEventTime(),
            t.getEventType(),
            t.getDescription(),
            t.getSeverity(),
            t.getActor(),
            t.getCreatedAt()
        );
    }
}
"""

service = """package com.cloudguard.alert.service;

import com.cloudguard.alert.dto.AlertDetailDto;
import com.cloudguard.alert.dto.AlertDto;
import com.cloudguard.alert.dto.UpdateAlertStatusDto;
import com.cloudguard.alert.entity.Alert;
import com.cloudguard.alert.entity.AlertTimeline;
import com.cloudguard.alert.mapper.AlertMapper;
import com.cloudguard.alert.repository.AlertCommentRepository;
import com.cloudguard.alert.repository.AlertRepository;
import com.cloudguard.alert.repository.AlertTimelineRepository;
import com.cloudguard.user.entity.User;
import com.cloudguard.user.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.OffsetDateTime;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class AlertService {
    private final AlertRepository alertRepository;
    private final AlertCommentRepository commentRepository;
    private final AlertTimelineRepository timelineRepository;
    private final UserRepository userRepository;

    public AlertService(AlertRepository alertRepository, AlertCommentRepository commentRepository, AlertTimelineRepository timelineRepository, UserRepository userRepository) {
        this.alertRepository = alertRepository;
        this.commentRepository = commentRepository;
        this.timelineRepository = timelineRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public Page<AlertDto> getAlerts(String severity, String status, Pageable pageable) {
        return alertRepository.findByFilters(severity, status, pageable)
                .map(AlertMapper::toDto);
    }

    @Transactional(readOnly = true)
    public AlertDetailDto getAlertDetail(UUID id) {
        Alert alert = alertRepository.findById(id).orElseThrow(() -> new RuntimeException("Alert not found"));
        var comments = commentRepository.findByAlertIdOrderByCreatedAtDesc(id).stream().map(AlertMapper::toDto).collect(Collectors.toList());
        var timeline = timelineRepository.findByAlertIdOrderByEventTimeDesc(id).stream().map(AlertMapper::toDto).collect(Collectors.toList());
        return new AlertDetailDto(AlertMapper.toDto(alert), comments, timeline);
    }
    
    @Transactional
    public AlertDto updateStatus(UUID id, UpdateAlertStatusDto dto, String username) {
        Alert alert = alertRepository.findById(id).orElseThrow(() -> new RuntimeException("Alert not found"));
        alert.setStatus(dto.status());
        if ("RESOLVED".equals(dto.status()) || "FALSE_POSITIVE".equals(dto.status())) {
            alert.setResolvedAt(OffsetDateTime.now());
            if (username != null) {
                userRepository.findByUsername(username).ifPresent(alert::setResolvedBy);
            }
        }
        alert = alertRepository.save(alert);
        
        // Add timeline
        AlertTimeline t = new AlertTimeline();
        t.setAlert(alert);
        t.setEventTime(OffsetDateTime.now());
        t.setEventType("STATUS_CHANGE");
        t.setDescription("Alert status changed to " + dto.status());
        t.setActor(username);
        timelineRepository.save(t);
        
        return AlertMapper.toDto(alert);
    }
}
"""

controller = """package com.cloudguard.alert.controller;

import com.cloudguard.alert.dto.AlertDetailDto;
import com.cloudguard.alert.dto.AlertDto;
import com.cloudguard.alert.dto.UpdateAlertStatusDto;
import com.cloudguard.alert.service.AlertService;
import com.cloudguard.common.dto.PaginatedResponse;
import com.cloudguard.common.response.ApiResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.OffsetDateTime;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/alerts")
public class AlertController {
    
    private final AlertService alertService;
    
    public AlertController(AlertService alertService) {
        this.alertService = alertService;
    }
    
    @GetMapping
    @PreAuthorize("hasAuthority('alerts:read')")
    public ApiResponse<PaginatedResponse<AlertDto>> getAlerts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String severity,
            @RequestParam(required = false) String status) {
        Page<AlertDto> alertPage = alertService.getAlerts(severity, status, PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt")));
        return new ApiResponse<>(true, new PaginatedResponse<>(
                alertPage.getContent(),
                alertPage.getNumber(),
                alertPage.getSize(),
                alertPage.getTotalElements(),
                alertPage.getTotalPages()
        ), "Alerts retrieved successfully", OffsetDateTime.now().toString());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('alerts:read')")
    public ApiResponse<AlertDetailDto> getAlertDetail(@PathVariable UUID id) {
        return new ApiResponse<>(true, alertService.getAlertDetail(id),
                "Alert detail retrieved", OffsetDateTime.now().toString());
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAuthority('alerts:write')")
    public ApiResponse<AlertDto> updateStatus(@PathVariable UUID id, @RequestBody UpdateAlertStatusDto dto, Authentication auth) {
        String username = auth != null ? auth.getName() : null;
        return new ApiResponse<>(true, alertService.updateStatus(id, dto, username),
                "Alert status updated", OffsetDateTime.now().toString());
    }
}
"""

os.makedirs(f"{base}/repository", exist_ok=True)
os.makedirs(f"{base}/mapper", exist_ok=True)
os.makedirs(f"{base}/service", exist_ok=True)
os.makedirs(f"{base}/controller", exist_ok=True)

with open(f"{base}/repository/AlertRepository.java", "w") as f: f.write(reps)
with open(f"{base}/repository/AlertCommentRepository.java", "w") as f: f.write(rep2)
with open(f"{base}/repository/AlertTimelineRepository.java", "w") as f: f.write(rep3)
with open(f"{base}/mapper/AlertMapper.java", "w") as f: f.write(mapper)
with open(f"{base}/service/AlertService.java", "w") as f: f.write(service)
with open(f"{base}/controller/AlertController.java", "w") as f: f.write(controller)

print("Alert module done.")
