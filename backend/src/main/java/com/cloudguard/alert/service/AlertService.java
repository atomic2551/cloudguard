package com.cloudguard.alert.service;

import com.cloudguard.alert.dto.AlertDto;
import com.cloudguard.alert.dto.AlertCommentDto;
import com.cloudguard.alert.dto.AlertTimelineDto;
import com.cloudguard.alert.dto.UpdateAlertStatusDto;
import com.cloudguard.alert.entity.Alert;
import com.cloudguard.alert.entity.AlertComment;
import com.cloudguard.alert.entity.AlertTimeline;
import com.cloudguard.alert.mapper.AlertMapper;
import com.cloudguard.alert.repository.AlertCommentRepository;
import com.cloudguard.alert.repository.AlertRepository;
import com.cloudguard.alert.repository.AlertTimelineRepository;
import com.cloudguard.common.dto.PaginatedResponse;
import com.cloudguard.user.entity.User;
import com.cloudguard.user.repository.UserRepository;
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
public class AlertService {

    private final AlertRepository alertRepository;
    private final AlertCommentRepository alertCommentRepository;
    private final AlertTimelineRepository alertTimelineRepository;
    private final UserRepository userRepository;
    private final AlertMapper alertMapper;

    public AlertService(AlertRepository alertRepository,
                        AlertCommentRepository alertCommentRepository,
                        AlertTimelineRepository alertTimelineRepository,
                        UserRepository userRepository,
                        AlertMapper alertMapper) {
        this.alertRepository = alertRepository;
        this.alertCommentRepository = alertCommentRepository;
        this.alertTimelineRepository = alertTimelineRepository;
        this.userRepository = userRepository;
        this.alertMapper = alertMapper;
    }

    @Transactional(readOnly = true)
    public PaginatedResponse<AlertDto> getAlerts(int page, int size, String severity, String status, String search) {
        // Adjust pagination: 1-indexed for the API layer to 0-indexed for Spring Data
        Pageable pageable = PageRequest.of(Math.max(0, page - 1), size);
        Page<Alert> alertPage = alertRepository.findAllWithFilters(severity, status, search, pageable);

        List<AlertDto> dtos = alertPage.getContent().stream()
                .map(alertMapper::toDto)
                .collect(Collectors.toList());

        return new PaginatedResponse<>(dtos, page, size, alertPage.getTotalElements());
    }

    @Transactional(readOnly = true)
    public AlertDto getAlertByIdOrNumber(String idOrNumber) {
        Alert alert = findAlert(idOrNumber);
        return alertMapper.toDto(alert);
    }

    @Transactional(readOnly = true)
    public List<AlertCommentDto> getAlertComments(String idOrNumber) {
        Alert alert = findAlert(idOrNumber);
        List<AlertComment> comments = alertCommentRepository.findByAlertIdWithAuthor(alert.getId());
        return comments.stream().map(alertMapper::toCommentDto).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<AlertTimelineDto> getAlertTimeline(String idOrNumber) {
        Alert alert = findAlert(idOrNumber);
        List<AlertTimeline> timeline = alertTimelineRepository.findByAlertIdOrderByEventTimeAsc(alert.getId());
        return timeline.stream().map(alertMapper::toTimelineDto).collect(Collectors.toList());
    }

    @Transactional
    public AlertDto updateAlertStatus(String idOrNumber, UpdateAlertStatusDto updateDto, String currentUsername) {
        Alert alert = findAlert(idOrNumber);
        
        String oldStatus = alert.getStatus();
        alert.setStatus(updateDto.getStatus());
        
        User currentUser = userRepository.findByUsername(currentUsername).orElse(null);
        String actor = currentUser != null ? currentUser.getDisplayName() : "System";
        
        if ("RESOLVED".equals(updateDto.getStatus()) || "FALSE_POSITIVE".equals(updateDto.getStatus())) {
            alert.setResolvedAt(OffsetDateTime.now());
            alert.setResolvedBy(currentUser);
        }

        alert = alertRepository.save(alert);
        
        // Add Timeline Event
        AlertTimeline timelineEvent = new AlertTimeline();
        timelineEvent.setAlert(alert);
        timelineEvent.setEventTime(OffsetDateTime.now());
        timelineEvent.setEventType("STATUS_CHANGE");
        timelineEvent.setDescription(String.format("Status changed from %s to %s", oldStatus, updateDto.getStatus()));
        timelineEvent.setActor(actor);
        timelineEvent.setSeverity(alert.getSeverity());
        alertTimelineRepository.save(timelineEvent);
        
        // Add comment if provided
        if (updateDto.getComment() != null && !updateDto.getComment().trim().isEmpty()) {
            AlertComment comment = new AlertComment();
            comment.setAlert(alert);
            comment.setAuthor(currentUser);
            comment.setContent(updateDto.getComment());
            alertCommentRepository.save(comment);
        }

        return alertMapper.toDto(alert);
    }

    @Transactional
    public AlertCommentDto addAlertComment(String idOrNumber, String content, String currentUsername) {
        Alert alert = findAlert(idOrNumber);
        User currentUser = userRepository.findByUsername(currentUsername).orElse(null);
        AlertComment comment = new AlertComment();
        comment.setAlert(alert);
        comment.setAuthor(currentUser);
        comment.setContent(content);
        comment = alertCommentRepository.save(comment);

        AlertTimeline timelineEvent = new AlertTimeline();
        timelineEvent.setAlert(alert);
        timelineEvent.setEventTime(OffsetDateTime.now());
        timelineEvent.setEventType("COMMENT");
        timelineEvent.setDescription("Added comment: " + (content.length() > 50 ? content.substring(0, 47) + "..." : content));
        timelineEvent.setActor(currentUser != null ? currentUser.getDisplayName() : "System");
        timelineEvent.setSeverity(alert.getSeverity());
        alertTimelineRepository.save(timelineEvent);

        return alertMapper.toCommentDto(comment);
    }

    private Alert findAlert(String idOrNumber) {
        if (idOrNumber == null || idOrNumber.trim().isEmpty()) {
            throw new EntityNotFoundException("Alert identifier cannot be null or empty");
        }
        try {
            UUID id = UUID.fromString(idOrNumber);
            return alertRepository.findById(id)
                    .orElseGet(() -> alertRepository.findByAlertNumber(idOrNumber.toUpperCase())
                    .orElseThrow(() -> new EntityNotFoundException("Alert not found: " + idOrNumber)));
        } catch (IllegalArgumentException e) {
            return alertRepository.findByAlertNumber(idOrNumber.toUpperCase())
                    .orElseThrow(() -> new EntityNotFoundException("Alert not found: " + idOrNumber));
        }
    }
}
