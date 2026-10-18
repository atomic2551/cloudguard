package com.cloudguard.event.controller;

import com.cloudguard.common.dto.PaginatedResponse;
import com.cloudguard.common.response.ApiResponse;
import com.cloudguard.event.dto.SecurityEventDto;
import com.cloudguard.event.service.SecurityEventService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/events")
public class SecurityEventController {

    private final SecurityEventService eventService;

    public SecurityEventController(SecurityEventService eventService) {
        this.eventService = eventService;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('events:read')")
    public PaginatedResponse<SecurityEventDto> getEvents(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String severity,
            @RequestParam(required = false) String search) {
        return eventService.getEvents(page, size, severity, search);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('events:read')")
    public ResponseEntity<Map<String, SecurityEventDto>> getEvent(@PathVariable String id) {
        SecurityEventDto event = eventService.getEventById(id);
        return ResponseEntity.ok(ApiResponse.success(event));
    }
}
