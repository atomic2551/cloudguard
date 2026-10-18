package com.cloudguard.event.service;

import com.cloudguard.common.dto.PaginatedResponse;
import com.cloudguard.event.dto.SecurityEventDto;
import com.cloudguard.event.entity.SecurityEvent;
import com.cloudguard.event.mapper.SecurityEventMapper;
import com.cloudguard.event.repository.SecurityEventRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@SuppressWarnings("null")
public class SecurityEventService {

    private final SecurityEventRepository eventRepository;
    private final SecurityEventMapper eventMapper;

    public SecurityEventService(SecurityEventRepository eventRepository, SecurityEventMapper eventMapper) {
        this.eventRepository = eventRepository;
        this.eventMapper = eventMapper;
    }

    @Transactional(readOnly = true)
    public PaginatedResponse<SecurityEventDto> getEvents(int page, int size, String severity, String search) {
        Pageable pageable = PageRequest.of(Math.max(0, page - 1), size);
        Page<SecurityEvent> eventPage = eventRepository.findAllWithFilters(severity, search, pageable);

        List<SecurityEventDto> dtos = eventPage.getContent().stream()
                .map(eventMapper::toDto)
                .collect(Collectors.toList());

        return new PaginatedResponse<>(dtos, page, size, eventPage.getTotalElements());
    }

    @Transactional(readOnly = true)
    public SecurityEventDto getEventById(String id) {
        UUID uuid = UUID.fromString(id);
        SecurityEvent event = eventRepository.findById(uuid)
                .orElseThrow(() -> new EntityNotFoundException("Security event not found: " + id));
        return eventMapper.toDto(event);
    }
}
