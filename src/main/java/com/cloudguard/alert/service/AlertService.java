package com.cloudguard.alert.service;

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
