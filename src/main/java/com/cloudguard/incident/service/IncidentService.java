package com.cloudguard.incident.service;

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
