package com.cloudguard.finding.service;

import com.cloudguard.common.dto.PaginatedResponse;
import com.cloudguard.finding.dto.IamFindingDto;
import com.cloudguard.finding.dto.UpdateFindingStatusDto;
import com.cloudguard.finding.entity.IamFinding;
import com.cloudguard.finding.mapper.IamFindingMapper;
import com.cloudguard.finding.repository.IamFindingRepository;
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
public class IamFindingService {

    private final IamFindingRepository findingRepository;
    private final IamFindingMapper findingMapper;

    public IamFindingService(IamFindingRepository findingRepository, IamFindingMapper findingMapper) {
        this.findingRepository = findingRepository;
        this.findingMapper = findingMapper;
    }

    @Transactional(readOnly = true)
    public PaginatedResponse<IamFindingDto> getFindings(int page, int size, String severity, String status) {
        Pageable pageable = PageRequest.of(Math.max(0, page - 1), size);
        Page<IamFinding> findingPage = findingRepository.findAllWithFilters(severity, status, pageable);

        List<IamFindingDto> dtos = findingPage.getContent().stream()
                .map(findingMapper::toDto)
                .collect(Collectors.toList());

        return new PaginatedResponse<>(dtos, page, size, findingPage.getTotalElements());
    }

    @Transactional
    public IamFindingDto updateFindingStatus(String idOrNumber, UpdateFindingStatusDto updateDto) {
        IamFinding finding = null;
        try {
            UUID id = UUID.fromString(idOrNumber);
            finding = findingRepository.findById(id).orElse(null);
        } catch (IllegalArgumentException e) {
            // handle fallback if we added findByNumber
        }

        if (finding == null) {
            throw new EntityNotFoundException("IAM Finding not found: " + idOrNumber);
        }

        finding.setStatus(updateDto.getStatus());
        
        if ("REMEDIATED".equals(updateDto.getStatus())) {
            finding.setRemediatedAt(OffsetDateTime.now());
        }

        finding = findingRepository.save(finding);
        return findingMapper.toDto(finding);
    }
}
