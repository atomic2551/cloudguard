package com.cloudguard.incident.service;

import com.cloudguard.alert.entity.Alert;
import com.cloudguard.alert.repository.AlertRepository;
import com.cloudguard.common.dto.PaginatedResponse;
import com.cloudguard.incident.dto.CreateIncidentDto;
import com.cloudguard.incident.dto.IncidentDto;
import com.cloudguard.incident.dto.IncidentNoteDto;
import com.cloudguard.incident.dto.IncidentTimelineDto;
import com.cloudguard.incident.dto.UpdateIncidentDto;
import com.cloudguard.incident.entity.Incident;
import com.cloudguard.incident.entity.IncidentAlert;
import com.cloudguard.incident.entity.IncidentNote;
import com.cloudguard.incident.entity.IncidentTimeline;
import com.cloudguard.incident.mapper.IncidentMapper;
import com.cloudguard.incident.repository.IncidentNoteRepository;
import com.cloudguard.incident.repository.IncidentRepository;
import com.cloudguard.incident.repository.IncidentTimelineRepository;
import com.cloudguard.user.entity.User;
import com.cloudguard.user.repository.UserRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@SuppressWarnings("null")
public class IncidentService {

    private final IncidentRepository incidentRepository;
    private final IncidentNoteRepository incidentNoteRepository;
    private final IncidentTimelineRepository incidentTimelineRepository;
    private final UserRepository userRepository;
    private final AlertRepository alertRepository;
    private final IncidentMapper incidentMapper;
    private final EntityManager entityManager; // Using EM for direct inserts into incident_alerts because it doesn't have its own repo currently

    public IncidentService(IncidentRepository incidentRepository,
                           IncidentNoteRepository incidentNoteRepository,
                           IncidentTimelineRepository incidentTimelineRepository,
                           UserRepository userRepository,
                           AlertRepository alertRepository,
                           IncidentMapper incidentMapper,
                           EntityManager entityManager) {
        this.incidentRepository = incidentRepository;
        this.incidentNoteRepository = incidentNoteRepository;
        this.incidentTimelineRepository = incidentTimelineRepository;
        this.userRepository = userRepository;
        this.alertRepository = alertRepository;
        this.incidentMapper = incidentMapper;
        this.entityManager = entityManager;
    }

    @Transactional(readOnly = true)
    public PaginatedResponse<IncidentDto> getIncidents(int page, int size, String severity, String status, String search) {
        Pageable pageable = PageRequest.of(Math.max(0, page - 1), size);
        Page<Incident> incidentPage = incidentRepository.findAllWithFilters(severity, status, search, pageable);

        List<IncidentDto> dtos = incidentPage.getContent().stream()
                .map(inc -> {
                    long alertCount = incidentRepository.countAlertsByIncidentId(inc.getId());
                    return incidentMapper.toDto(inc, alertCount);
                })
                .collect(Collectors.toList());

        return new PaginatedResponse<>(dtos, page, size, incidentPage.getTotalElements());
    }

    @Transactional(readOnly = true)
    public IncidentDto getIncidentByIdOrNumber(String idOrNumber) {
        Incident incident = findIncident(idOrNumber);
        long alertCount = incidentRepository.countAlertsByIncidentId(incident.getId());
        return incidentMapper.toDto(incident, alertCount);
    }

    @Transactional(readOnly = true)
    public List<IncidentNoteDto> getIncidentNotes(String idOrNumber) {
        Incident incident = findIncident(idOrNumber);
        List<IncidentNote> notes = incidentNoteRepository.findByIncidentIdWithAuthor(incident.getId());
        return notes.stream().map(incidentMapper::toNoteDto).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<IncidentTimelineDto> getIncidentTimeline(String idOrNumber) {
        Incident incident = findIncident(idOrNumber);
        List<IncidentTimeline> timeline = incidentTimelineRepository.findByIncidentIdOrderByEventTimeAsc(incident.getId());
        return timeline.stream().map(incidentMapper::toTimelineDto).collect(Collectors.toList());
    }

    @Transactional
    public IncidentDto createIncident(CreateIncidentDto createDto, String currentUsername) {
        User currentUser = userRepository.findByUsername(currentUsername).orElse(null);
        String actor = currentUser != null ? currentUser.getDisplayName() : "System";
        
        Incident incident = new Incident();
        incident.setTitle(createDto.getTitle());
        incident.setDescription(createDto.getDescription());
        incident.setSeverity(createDto.getSeverity());
        incident.setCategory(createDto.getCategory());
        incident.setCreatedBy(currentUser);
        incident.setStatus("OPEN");
        
        if (createDto.getAssignedTo() != null) {
            userRepository.findById(UUID.fromString(createDto.getAssignedTo()))
                    .ifPresent(incident::setAssignedTo);
        }
        
        incident = incidentRepository.save(incident);
        
        // Link alerts if provided
        long exactLinkCount = 0;
        if (createDto.getAlertIds() != null && !createDto.getAlertIds().isEmpty()) {
            for (UUID alertId : createDto.getAlertIds()) {
                Alert a = alertRepository.findById(alertId).orElse(null);
                if (a != null) {
                    IncidentAlert ia = new IncidentAlert();
                    ia.setId(new IncidentAlert.IncidentAlertId(incident.getId(), alertId));
                    ia.setLinkedBy(currentUser != null ? currentUser.getId() : null);
                    entityManager.persist(ia);
                    exactLinkCount++;
                    
                    // Mark alert as investigating
                    a.setStatus("INVESTIGATING");
                    alertRepository.save(a);
                }
            }
        }
        
        // Add creation event to timeline
        IncidentTimeline timelineEvent = new IncidentTimeline();
        timelineEvent.setIncident(incident);
        timelineEvent.setEventTime(OffsetDateTime.now());
        timelineEvent.setEventType("INCIDENT_CREATED");
        timelineEvent.setDescription("Incident created");
        timelineEvent.setActor(actor);
        incidentTimelineRepository.save(timelineEvent);
        
        return incidentMapper.toDto(incident, exactLinkCount);
    }
    
    @Transactional
    public IncidentDto updateIncident(String idOrNumber, UpdateIncidentDto updateDto, String currentUsername) {
        Incident incident = findIncident(idOrNumber);
        User currentUser = userRepository.findByUsername(currentUsername).orElse(null);
        String actor = currentUser != null ? currentUser.getDisplayName() : "System";
        
        boolean statusChanged = false;
        String oldStatus = incident.getStatus();
        
        if (updateDto.getTitle() != null) incident.setTitle(updateDto.getTitle());
        if (updateDto.getDescription() != null) incident.setDescription(updateDto.getDescription());
        if (updateDto.getSeverity() != null) incident.setSeverity(updateDto.getSeverity());
        if (updateDto.getCategory() != null) incident.setCategory(updateDto.getCategory());
        
        if (updateDto.getStatus() != null && !updateDto.getStatus().equals(incident.getStatus())) {
            incident.setStatus(updateDto.getStatus());
            statusChanged = true;
            if ("RESOLVED".equals(updateDto.getStatus()) || "CONTAINED".equals(updateDto.getStatus())) {
                incident.setResolvedAt(OffsetDateTime.now());
            } else if ("CLOSED".equals(updateDto.getStatus())) {
                incident.setClosedAt(OffsetDateTime.now());
                if (incident.getResolvedAt() == null) {
                    incident.setResolvedAt(OffsetDateTime.now());
                }
            }
        }
        
        if (updateDto.getAssignedTo() != null) {
             userRepository.findById(UUID.fromString(updateDto.getAssignedTo()))
                    .ifPresent(incident::setAssignedTo);
             
             IncidentTimeline assignEvent = new IncidentTimeline();
             assignEvent.setIncident(incident);
             assignEvent.setEventTime(OffsetDateTime.now());
             assignEvent.setEventType("ASSIGNMENT");
             assignEvent.setDescription("Incident assigned to " + incident.getAssignedTo().getDisplayName());
             assignEvent.setActor(actor);
             incidentTimelineRepository.save(assignEvent);
        }
        
        incident = incidentRepository.save(incident);
        
        if (statusChanged) {
            IncidentTimeline timelineEvent = new IncidentTimeline();
            timelineEvent.setIncident(incident);
            timelineEvent.setEventTime(OffsetDateTime.now());
            timelineEvent.setEventType("STATUS_CHANGE");
            timelineEvent.setDescription(String.format("Status changed from %s to %s", oldStatus, incident.getStatus()));
            timelineEvent.setActor(actor);
            incidentTimelineRepository.save(timelineEvent);
        }
        
        long alertCount = incidentRepository.countAlertsByIncidentId(incident.getId());
        return incidentMapper.toDto(incident, alertCount);
    }

    private Incident findIncident(String idOrNumber) {
        try {
            UUID id = UUID.fromString(idOrNumber);
            return incidentRepository.findById(id)
                    .orElseGet(() -> incidentRepository.findByIncidentNumber(idOrNumber.toUpperCase())
                    .orElseThrow(() -> new EntityNotFoundException("Incident not found: " + idOrNumber)));
        } catch (IllegalArgumentException e) {
            return incidentRepository.findByIncidentNumber(idOrNumber.toUpperCase())
                    .orElseThrow(() -> new EntityNotFoundException("Incident not found: " + idOrNumber));
        }
    }
}
