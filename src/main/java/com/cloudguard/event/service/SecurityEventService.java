package com.cloudguard.event.service;
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
