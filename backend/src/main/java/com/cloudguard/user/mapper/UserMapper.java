package com.cloudguard.user.mapper;

import com.cloudguard.role.entity.Role;
import com.cloudguard.user.dto.UserDto;
import com.cloudguard.user.entity.User;
import org.springframework.stereotype.Component;

import java.util.stream.Collectors;

@Component
@SuppressWarnings("null")
public class UserMapper {

    public UserDto toDto(User user) {
        if (user == null) return null;

        UserDto dto = new UserDto();
        dto.setId(user.getId().toString());
        dto.setUsername(user.getUsername());
        dto.setEmail(user.getEmail());
        dto.setDisplayName(user.getDisplayName());
        dto.setDepartment(user.getDepartment());
        dto.setStatus(user.getStatus());
        dto.setMfaEnabled(user.isMfaEnabled());

        if (user.getRoles() != null) {
            dto.setRoles(user.getRoles().stream().map(Role::getName).collect(Collectors.toList()));
        }

        if (user.getLastLoginAt() != null) {
            dto.setLastLoginAt(user.getLastLoginAt().toString());
        }
        dto.setLastLoginIp(user.getLastLoginIp());

        if (user.getCreatedAt() != null) {
            dto.setCreatedAt(user.getCreatedAt().toString());
        }
        if (user.getUpdatedAt() != null) {
            dto.setUpdatedAt(user.getUpdatedAt().toString());
        }

        return dto;
    }
}
