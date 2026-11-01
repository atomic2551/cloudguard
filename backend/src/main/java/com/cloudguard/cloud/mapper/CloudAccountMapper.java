package com.cloudguard.cloud.mapper;

import com.cloudguard.cloud.dto.CloudAccountDto;
import com.cloudguard.cloud.entity.CloudAccount;
import org.springframework.stereotype.Component;

@Component
public class CloudAccountMapper {

    public CloudAccountDto toDto(CloudAccount account) {
        if (account == null) return null;

        CloudAccountDto dto = new CloudAccountDto();
        dto.setId(account.getId().toString());
        dto.setName(account.getName());
        dto.setProvider(account.getProvider());
        dto.setAccountId(account.getAccountId());
        dto.setRoleArn(account.getRoleArn());
        dto.setPrimaryRegion(account.getPrimaryRegion());
        dto.setMonitoredRegions(account.getMonitoredRegions());
        dto.setStatus(account.getStatus());
        dto.setSyncError(account.getSyncError());

        if (account.getLastSyncAt() != null) {
            dto.setLastSyncAt(account.getLastSyncAt().toString());
        }
        if (account.getCreatedAt() != null) {
            dto.setCreatedAt(account.getCreatedAt().toString());
        }
        if (account.getUpdatedAt() != null) {
            dto.setUpdatedAt(account.getUpdatedAt().toString());
        }

        return dto;
    }
}
