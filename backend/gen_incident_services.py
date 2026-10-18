import os
base = "src/main/java/com/cloudguard/incident"

reps = """package com.cloudguard.incident.repository;
import com.cloudguard.incident.entity.Incident;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.UUID;

@Repository
public interface IncidentRepository extends JpaRepository<Incident, UUID> {
    
    @Query("SELECT i FROM Incident i LEFT JOIN FETCH i.assignedTo LEFT JOIN FETCH i.createdBy WHERE " +
           "(:severity IS NULL OR i.severity = :severity) AND " +
           "(:status IS NULL OR i.status = :status)")
    Page<Incident> findByFilters(@Param("severity") String severity, @Param("status") String status, Pageable pageable);
}
"""

rep2 = """package com.cloudguard.incident.repository;
import com.cloudguard.incident.entity.IncidentNote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;
@Repository
public interface IncidentNoteRepository extends JpaRepository<IncidentNote, UUID> {
    List<IncidentNote> findByIncidentIdOrderByCreatedAtDesc(UUID incidentId);
}
"""

rep3 = """package com.cloudguard.incident.repository;
import com.cloudguard.incident.entity.IncidentTimeline;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;
@Repository
public interface IncidentTimelineRepository extends JpaRepository<IncidentTimeline, UUID> {
    List<IncidentTimeline> findByIncidentIdOrderByEventTimeDesc(UUID incidentId);
}
"""

rep4 = """package com.cloudguard.incident.repository;
import com.cloudguard.incident.entity.IncidentAlert;
import com.cloudguard.incident.entity.IncidentAlertId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;
@Repository
public interface IncidentAlertRepository extends JpaRepository<IncidentAlert, IncidentAlertId> {
    List<IncidentAlert> findByIncidentId(UUID incidentId);
}
"""

mapper = """package com.cloudguard.incident.mapper;

import com.cloudguard.incident.dto.IncidentNoteDto;
import com.cloudguard.incident.dto.IncidentDto;
import com.cloudguard.incident.dto.IncidentTimelineDto;
import com.cloudguard.incident.entity.Incident;
import com.cloudguard.incident.entity.IncidentNote;
import com.cloudguard.incident.entity.IncidentTimeline;
import com.cloudguard.common.dto.AlertSeverity;

public class IncidentMapper {
    public static IncidentDto toDto(Incident incident) {
        if (incident == null) return null;
        return new IncidentDto(
            incident.getId(),
            incident.getIncidentNumber(),
            incident.getTitle(),
            incident.getDescription(),
            AlertSeverity.valueOf(incident.getSeverity()),
            incident.getStatus(),
            incident.getCategory(),
            incident.getAssignedTo() != null ? incident.getAssignedTo().getId() : null,
            incident.getAssignedTo() != null ? incident.getAssignedTo().getDisplayName() : null,
            incident.getCreatedBy() != null ? incident.getCreatedBy().getId() : null,
            incident.getCreatedBy() != null ? incident.getCreatedBy().getDisplayName() : null,
            incident.getResolvedAt(),
            incident.getClosedAt(),
            incident.getCreatedAt(),
            incident.getUpdatedAt(),
            null, // alertCount filled in service if needed
            null  // alerts filled in service if needed
        );
    }
    
    public static IncidentNoteDto toDto(IncidentNote n) {
        if (n == null) return null;
        return new IncidentNoteDto(
            n.getId(),
            n.getIncident().getId(),
            n.getAuthor() != null ? n.getAuthor().getId() : null,
            n.getAuthor() != null ? n.getAuthor().getDisplayName() : "System",
            n.getContent(),
            n.isPrivate(),
            n.getCreatedAt()
        );
    }

    public static IncidentTimelineDto toDto(IncidentTimeline t) {
        if (t == null) return null;
        return new IncidentTimelineDto(
            t.getId(),
            t.getIncident().getId(),
            t.getEventTime(),
            t.getEventType(),
            t.getDescription(),
            t.getActor(),
            t.getCreatedAt()
        );
    }
}
"""

service = """package com.cloudguard.incident.service;

import com.cloudguard.alert.dto.AlertDto;
import com.cloudguard.alert.mapper.AlertMapper;
import com.cloudguard.incident.dto.IncidentDetailDto;
import com.cloudguard.incident.dto.IncidentDto;
import com.cloudguard.incident.dto.UpdateIncidentDto;
import com.cloudguard.incident.entity.Incident;
import com.cloudguard.incident.entity.IncidentTimeline;
import com.cloudguard.incident.mapper.IncidentMapper;
import com.cloudguard.incident.repository.IncidentAlertRepository;
import com.cloudguard.incident.repository.IncidentNoteRepository;
import com.cloudguard.incident.repository.IncidentRepository;
import com.cloudguard.incident.repository.IncidentTimelineRepository;
import com.cloudguard.user.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class IncidentService {
    private final IncidentRepository incidentRepository;
    private final IncidentNoteRepository noteRepository;
    private final IncidentTimelineRepository timelineRepository;
    private final IncidentAlertRepository incidentAlertRepository;
    private final UserRepository userRepository;

    public IncidentService(IncidentRepository incidentRepository, IncidentNoteRepository noteRepository, IncidentTimelineRepository timelineRepository, IncidentAlertRepository incidentAlertRepository, UserRepository userRepository) {
        this.incidentRepository = incidentRepository;
        this.noteRepository = noteRepository;
        this.timelineRepository = timelineRepository;
        this.incidentAlertRepository = incidentAlertRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public Page<IncidentDto> getIncidents(String severity, String status, Pageable pageable) {
        return incidentRepository.findByFilters(severity, status, pageable)
                .map(i -> {
                    IncidentDto dto = IncidentMapper.toDto(i);
                    int count = incidentAlertRepository.findByIncidentId(i.getId()).size();
                    return new IncidentDto(dto.id(), dto.incidentNumber(), dto.title(), dto.description(), dto.severity(), dto.status(), dto.category(), dto.assignedTo(), dto.assignedToName(), dto.createdBy(), dto.createdByName(), dto.resolvedAt(), dto.closedAt(), dto.createdAt(), dto.updatedAt(), count, null);
                });
    }

    @Transactional(readOnly = true)
    public IncidentDetailDto getIncidentDetail(UUID id) {
        Incident incident = incidentRepository.findById(id).orElseThrow(() -> new RuntimeException("Incident not found"));
        var notes = noteRepository.findByIncidentIdOrderByCreatedAtDesc(id).stream().map(IncidentMapper::toDto).collect(Collectors.toList());
        var timeline = timelineRepository.findByIncidentIdOrderByEventTimeDesc(id).stream().map(IncidentMapper::toDto).collect(Collectors.toList());
        var alerts = incidentAlertRepository.findByIncidentId(id).stream().map(ia -> AlertMapper.toDto(ia.getAlert())).collect(Collectors.toList());
        
        IncidentDto dto = IncidentMapper.toDto(incident);
        IncidentDto fullDto = new IncidentDto(dto.id(), dto.incidentNumber(), dto.title(), dto.description(), dto.severity(), dto.status(), dto.category(), dto.assignedTo(), dto.assignedToName(), dto.createdBy(), dto.createdByName(), dto.resolvedAt(), dto.closedAt(), dto.createdAt(), dto.updatedAt(), alerts.size(), alerts);
        
        return new IncidentDetailDto(fullDto, notes, timeline);
    }
    
    @Transactional
    public IncidentDto updateStatus(UUID id, UpdateIncidentDto dto, String username) {
        Incident incident = incidentRepository.findById(id).orElseThrow(() -> new RuntimeException("Incident not found"));
        if (dto.title() != null) incident.setTitle(dto.title());
        if (dto.description() != null) incident.setDescription(dto.description());
        if (dto.severity() != null) incident.setSeverity(dto.severity().name());
        if (dto.category() != null) incident.setCategory(dto.category());
        if (dto.status() != null) {
             incident.setStatus(dto.status());
             if ("RESOLVED".equals(dto.status())) incident.setResolvedAt(OffsetDateTime.now());
             if ("CLOSED".equals(dto.status())) incident.setClosedAt(OffsetDateTime.now());
        }
        
        if (dto.assignedTo() != null) {
            userRepository.findById(dto.assignedTo()).ifPresent(incident::setAssignedTo);
        }
        
        incident = incidentRepository.save(incident);
        
        // Add timeline
        IncidentTimeline t = new IncidentTimeline();
        t.setIncident(incident);
        t.setEventTime(OffsetDateTime.now());
        t.setEventType("STATUS_CHANGE");
        t.setDescription("Incident updated by " + username);
        t.setActor(username);
        timelineRepository.save(t);
        
        return IncidentMapper.toDto(incident);
    }
}
"""

controller = """package com.cloudguard.incident.controller;

import com.cloudguard.incident.dto.IncidentDetailDto;
import com.cloudguard.incident.dto.IncidentDto;
import com.cloudguard.incident.dto.UpdateIncidentDto;
import com.cloudguard.incident.service.IncidentService;
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
@RequestMapping("/api/v1/incidents")
public class IncidentController {
    
    private final IncidentService incidentService;
    
    public IncidentController(IncidentService incidentService) {
        this.incidentService = incidentService;
    }
    
    @GetMapping
    @PreAuthorize("hasAuthority('incidents:read')")
    public ApiResponse<PaginatedResponse<IncidentDto>> getIncidents(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String severity,
            @RequestParam(required = false) String status) {
        Page<IncidentDto> pageData = incidentService.getIncidents(severity, status, PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt")));
        return new ApiResponse<>(true, new PaginatedResponse<>(
                pageData.getContent(),
                pageData.getNumber(),
                pageData.getSize(),
                pageData.getTotalElements(),
                pageData.getTotalPages()
        ), "Incidents retrieved successfully", OffsetDateTime.now().toString());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('incidents:read')")
    public ApiResponse<IncidentDetailDto> getIncidentDetail(@PathVariable UUID id) {
        return new ApiResponse<>(true, incidentService.getIncidentDetail(id),
                "Incident detail retrieved", OffsetDateTime.now().toString());
    }

    @PatchMapping("/{id}")
    @PreAuthorize("hasAuthority('incidents:write')")
    public ApiResponse<IncidentDto> updateIncident(@PathVariable UUID id, @RequestBody UpdateIncidentDto dto, Authentication auth) {
        String username = auth != null ? auth.getName() : null;
        return new ApiResponse<>(true, incidentService.updateStatus(id, dto, username),
                "Incident updated", OffsetDateTime.now().toString());
    }
}
"""

os.makedirs(f"{base}/repository", exist_ok=True)
os.makedirs(f"{base}/mapper", exist_ok=True)
os.makedirs(f"{base}/service", exist_ok=True)
os.makedirs(f"{base}/controller", exist_ok=True)

with open(f"{base}/repository/IncidentRepository.java", "w") as f: f.write(reps)
with open(f"{base}/repository/IncidentNoteRepository.java", "w") as f: f.write(rep2)
with open(f"{base}/repository/IncidentTimelineRepository.java", "w") as f: f.write(rep3)
with open(f"{base}/repository/IncidentAlertRepository.java", "w") as f: f.write(rep4)
with open(f"{base}/mapper/IncidentMapper.java", "w") as f: f.write(mapper)
with open(f"{base}/service/IncidentService.java", "w") as f: f.write(service)
with open(f"{base}/controller/IncidentController.java", "w") as f: f.write(controller)

print("Incident module done.")
