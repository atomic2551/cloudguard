package com.cloudguard.audit.service;

import com.cloudguard.audit.dto.AuditLogDto;
import com.cloudguard.audit.entity.AuditLog;
import com.cloudguard.audit.mapper.AuditLogMapper;
import com.cloudguard.audit.repository.AuditLogRepository;
import com.cloudguard.common.dto.PaginatedResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class AuditLogService {

    private final AuditLogRepository repository;
    private final AuditLogMapper mapper;

    public AuditLogService(AuditLogRepository repository, AuditLogMapper mapper) {
        this.repository = repository;
        this.mapper = mapper;
    }

    @Transactional(readOnly = true)
    public PaginatedResponse<AuditLogDto> getAuditLogs(int page, int size) {
        int pageIndex = Math.max(0, page - 1);
        Page<AuditLog> logPage = repository.findAll(
                PageRequest.of(pageIndex, size, Sort.by(Sort.Direction.DESC, "createdAt"))
        );

        List<AuditLogDto> items = logPage.getContent().stream()
                .map(mapper::toDto)
                .collect(Collectors.toList());

        return new PaginatedResponse<>(items, page, size, logPage.getTotalElements());
    }
}
