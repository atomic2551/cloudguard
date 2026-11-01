package com.cloudguard.cloud.service;

import com.cloudguard.cloud.dto.CloudAccountDto;
import com.cloudguard.cloud.dto.CreateCloudAccountDto;
import com.cloudguard.cloud.dto.UpdateCloudAccountDto;
import com.cloudguard.cloud.entity.CloudAccount;
import com.cloudguard.cloud.mapper.CloudAccountMapper;
import com.cloudguard.cloud.repository.CloudAccountRepository;
import com.cloudguard.common.dto.PaginatedResponse;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@SuppressWarnings("null")
public class CloudAccountService {

    private final CloudAccountRepository repository;
    private final CloudAccountMapper mapper;

    public CloudAccountService(CloudAccountRepository repository, CloudAccountMapper mapper) {
        this.repository = repository;
        this.mapper = mapper;
    }

    @Transactional(readOnly = true)
    public PaginatedResponse<CloudAccountDto> getAccounts(int page, int size) {
        int pageIndex = Math.max(0, page - 1);
        Page<CloudAccount> accountPage = repository.findAll(
                PageRequest.of(pageIndex, size, Sort.by(Sort.Direction.DESC, "createdAt"))
        );

        List<CloudAccountDto> items = accountPage.getContent().stream()
                .map(mapper::toDto)
                .collect(Collectors.toList());

        return new PaginatedResponse<>(items, page, size, accountPage.getTotalElements());
    }

    @Transactional(readOnly = true)
    public CloudAccountDto getAccountById(UUID id) {
        CloudAccount account = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Cloud account not found: " + id));
        return mapper.toDto(account);
    }

    @Transactional
    public CloudAccountDto createAccount(CreateCloudAccountDto dto) {
        CloudAccount account = new CloudAccount();
        account.setName(dto.getName());
        account.setProvider(dto.getProvider() != null ? dto.getProvider() : "AWS");
        account.setAccountId(dto.getAccountId());
        account.setRoleArn(dto.getRoleArn());
        account.setPrimaryRegion(dto.getPrimaryRegion() != null ? dto.getPrimaryRegion() : "us-east-1");
        account.setMonitoredRegions(dto.getMonitoredRegions());
        account.setStatus("CONNECTED");
        account = repository.save(account);
        return mapper.toDto(account);
    }

    @Transactional
    public CloudAccountDto updateAccount(UUID id, UpdateCloudAccountDto dto) {
        CloudAccount account = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Cloud account not found: " + id));

        if (dto.getName() != null) account.setName(dto.getName());
        if (dto.getRoleArn() != null) account.setRoleArn(dto.getRoleArn());
        if (dto.getPrimaryRegion() != null) account.setPrimaryRegion(dto.getPrimaryRegion());
        if (dto.getMonitoredRegions() != null) account.setMonitoredRegions(dto.getMonitoredRegions());
        if (dto.getStatus() != null) account.setStatus(dto.getStatus());

        account = repository.save(account);
        return mapper.toDto(account);
    }

    @Transactional
    public void deleteAccount(UUID id) {
        if (!repository.existsById(id)) {
            throw new EntityNotFoundException("Cloud account not found: " + id);
        }
        repository.deleteById(id);
    }
}
