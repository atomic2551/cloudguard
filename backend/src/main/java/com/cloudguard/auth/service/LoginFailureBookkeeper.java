package com.cloudguard.auth.service;

import com.cloudguard.audit.entity.AuditLog;
import com.cloudguard.audit.repository.AuditLogRepository;
import com.cloudguard.user.entity.User;
import com.cloudguard.user.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * Handles login-failure bookkeeping (incrementing failed_login_count,
 * setting locked_until, writing LOGIN_FAILURE / ACCOUNT_LOCKED audit rows)
 * in a REQUIRES_NEW transaction so the data survives the rollback
 * triggered by the BadCredentialsException thrown from authenticateUser().
 */
@Service
public class LoginFailureBookkeeper {

    private final UserRepository userRepository;
    private final AuditLogRepository auditLogRepository;

    public LoginFailureBookkeeper(UserRepository userRepository,
                                   AuditLogRepository auditLogRepository) {
        this.userRepository = userRepository;
        this.auditLogRepository = auditLogRepository;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void recordFailure(User user, String ipAddress,
                              int maxFailedLoginAttempts, int lockoutDurationMinutes) {
        // Re-fetch inside this new transaction to avoid detached-entity issues
        User freshUser = userRepository.findById(user.getId()).orElse(null);
        if (freshUser == null) return;

        OffsetDateTime now = OffsetDateTime.now();
        int newCount;

        // Check if previous lockout has expired
        if (freshUser.getLockedUntil() != null && freshUser.getLockedUntil().isBefore(now)) {
            // Lock expired: reset lock and set count = 1
            userRepository.resetExpiredLockoutToOne(freshUser.getId());
            freshUser.setLockedUntil(null);
            freshUser.setFailedLoginCount(1);
            newCount = 1;
        } else {
            // Atomic failure increment: UPDATE ... SET failed_login_count = failed_login_count + 1 WHERE id = ?
            userRepository.incrementFailedLoginCount(freshUser.getId());
            freshUser = userRepository.findById(freshUser.getId()).orElse(freshUser);
            newCount = freshUser.getFailedLoginCount();

            if (newCount >= maxFailedLoginAttempts) {
                OffsetDateTime lockedUntil = now.plusMinutes(lockoutDurationMinutes);
                freshUser.setLockedUntil(lockedUntil);
                userRepository.setLockedUntilById(freshUser.getId(), lockedUntil);
            }
        }

        logEvent(freshUser, "LOGIN_FAILURE", "User", freshUser.getId().toString(),
                 ipAddress, "FAILURE",
                 Map.of("failedAttempts", newCount));

        if (newCount >= maxFailedLoginAttempts && freshUser.getLockedUntil() != null) {
            logEvent(freshUser, "ACCOUNT_LOCKED", "User", freshUser.getId().toString(),
                     ipAddress, "SUCCESS",
                     Map.of("reason", "Max failed attempts reached for IP"));
        }
    }

    @Transactional
    public com.cloudguard.auth.dto.AuthUserDto recordSuccess(User user, String ipAddress) {
        User freshUser = userRepository.findById(user.getId()).orElse(user);
        freshUser.setFailedLoginCount(0);
        freshUser.setLockedUntil(null);
        freshUser.setLastLoginAt(OffsetDateTime.now());
        freshUser.setLastLoginIp(ipAddress);
        userRepository.save(freshUser);

        logEvent(freshUser, "LOGIN_SUCCESS", "User", freshUser.getId().toString(),
                 ipAddress, "SUCCESS", null);

        com.cloudguard.auth.dto.AuthUserDto dto = new com.cloudguard.auth.dto.AuthUserDto();
        dto.setId(freshUser.getId().toString());
        dto.setUsername(freshUser.getUsername());
        dto.setEmail(freshUser.getEmail());
        dto.setDisplayName(freshUser.getDisplayName());
        dto.setDepartment(freshUser.getDepartment());
        dto.setStatus(freshUser.getStatus());
        dto.setMfaEnabled(freshUser.isMfaEnabled());

        java.util.List<String> roleNames = freshUser.getRoles().stream()
                .map(r -> r.getName())
                .collect(java.util.stream.Collectors.toList());
        dto.setRoles(roleNames);

        java.util.List<String> permissionStrs = freshUser.getRoles().stream()
                .flatMap(role -> role.getPermissions().stream())
                .map(p -> p.getResource() + ":" + p.getAction())
                .distinct()
                .collect(java.util.stream.Collectors.toList());
        dto.setPermissions(permissionStrs);

        return dto;
    }

    private void logEvent(User user, String action, String resourceType,
                          String resourceId, String ipAddress, String result,
                          Map<String, Object> additionalDetails) {
        AuditLog log = new AuditLog();
        log.setUser(user);
        log.setUserDisplayName(user.getDisplayName());
        log.setAction(action);
        log.setResourceType(resourceType);
        log.setResourceId(resourceId);
        log.setIpAddress(ipAddress);
        log.setResult(result);
        log.setDetails(additionalDetails != null ? additionalDetails : new HashMap<>());
        auditLogRepository.save(log);
    }
}
