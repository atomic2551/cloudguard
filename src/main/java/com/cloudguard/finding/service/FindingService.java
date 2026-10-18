package com.cloudguard.finding.service;
import com.cloudguard.finding.dto.IamFindingDto;
import com.cloudguard.finding.dto.SecurityFindingDto;
import com.cloudguard.finding.mapper.FindingMapper;
import com.cloudguard.finding.repository.IamFindingRepository;
import com.cloudguard.finding.repository.SecurityFindingRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class FindingService {
    private final SecurityFindingRepository secFindingRepository;
    private final IamFindingRepository iamFindingRepository;
    public FindingService(SecurityFindingRepository secFindingRepository, IamFindingRepository iamFindingRepository) {
        this.secFindingRepository = secFindingRepository;
        this.iamFindingRepository = iamFindingRepository;
    }
    
    @Transactional(readOnly = true)
    public Page<SecurityFindingDto> getScannerFindings(String severity, String status, Pageable pageable) {
        return secFindingRepository.findByFilters(severity, status, pageable).map(FindingMapper::toDto);
    }

    @Transactional(readOnly = true)
    public Page<IamFindingDto> getIamFindings(String severity, String status, Pageable pageable) {
        return iamFindingRepository.findByFilters(severity, status, pageable).map(FindingMapper::toDto);
    }
}
