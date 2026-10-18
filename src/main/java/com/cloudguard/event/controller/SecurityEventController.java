package com.cloudguard.event.controller;
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
