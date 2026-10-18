package com.cloudguard.finding.service;

import com.cloudguard.common.dto.PaginatedResponse;
import com.cloudguard.finding.dto.SecurityFindingDto;
import com.cloudguard.finding.dto.UpdateFindingStatusDto;
import com.cloudguard.finding.entity.SecurityFinding;
import com.cloudguard.finding.mapper.SecurityFindingMapper;
import com.cloudguard.finding.repository.SecurityFindingRepository;
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
public class SecurityFindingService {

    private final SecurityFindingRepository findingRepository;
    private final SecurityFindingMapper findingMapper;

    public SecurityFindingService(SecurityFindingRepository findingRepository, SecurityFindingMapper findingMapper) {
        this.findingRepository = findingRepository;
        this.findingMapper = findingMapper;
    }

    @Transactional(readOnly = true)
    public PaginatedResponse<SecurityFindingDto> getFindings(int page, int size, String severity, String category, String status) {
        Pageable pageable = PageRequest.of(Math.max(0, page - 1), size);
        Page<SecurityFinding> findingPage = findingRepository.findAllWithFilters(severity, category, status, pageable);

        List<SecurityFindingDto> dtos = findingPage.getContent().stream()
                .map(findingMapper::toDto)
                .collect(Collectors.toList());

        return new PaginatedResponse<>(dtos, page, size, findingPage.getTotalElements());
    }

    @Transactional
    public SecurityFindingDto updateFindingStatus(String idOrNumber, UpdateFindingStatusDto updateDto) {
        SecurityFinding finding = null;
        try {
            UUID id = UUID.fromString(idOrNumber);
            // In a real app we might also search by number, but IDs are safer here
            finding = findingRepository.findById(id).orElse(null);
        } catch (IllegalArgumentException e) {
            // handle fallback if we added findByNumber
        }
        
        if (finding == null) {
            throw new EntityNotFoundException("Finding not found: " + idOrNumber);
        }

        finding.setStatus(updateDto.getStatus());
        
        if ("REMEDIATED".equals(updateDto.getStatus())) {
            finding.setRemediatedAt(OffsetDateTime.now());
        }

        finding = findingRepository.save(finding);
        return findingMapper.toDto(finding);
    }
}
