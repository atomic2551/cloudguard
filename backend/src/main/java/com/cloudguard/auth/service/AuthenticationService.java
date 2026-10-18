package com.cloudguard.auth.service;

import com.cloudguard.audit.entity.AuditLog;
import com.cloudguard.audit.repository.AuditLogRepository;
import com.cloudguard.auth.dto.AuthUserDto;
import com.cloudguard.auth.dto.LoginRequest;
import com.cloudguard.auth.dto.LoginResponse;
import com.cloudguard.security.jwt.JwtTokenProvider;
import com.cloudguard.user.entity.User;
import com.cloudguard.user.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.LockedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class AuthenticationService {

    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider tokenProvider;
    private final UserRepository userRepository;
    private final AuditLogRepository auditLogRepository;

    @Value("${cloudguard.security.max-failed-login-attempts:5}")
    private int maxFailedLoginAttempts;

    @Value("${cloudguard.security.lockout-duration-minutes:30}")
    private int lockoutDurationMinutes;

    public AuthenticationService(AuthenticationManager authenticationManager,
                                 JwtTokenProvider tokenProvider,
                                 UserRepository userRepository,
                                 AuditLogRepository auditLogRepository) {
        this.authenticationManager = authenticationManager;
        this.tokenProvider = tokenProvider;
        this.userRepository = userRepository;
        this.auditLogRepository = auditLogRepository;
    }

    @Transactional
    public LoginResponse authenticateUser(LoginRequest loginRequest, String ipAddress) {
        // Find user manually first to check lockout status
        User user = userRepository.findByUsername(loginRequest.getUsername()).orElse(null);

        if (user != null) {
            checkUserLockoutStatus(user);
        }

        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(loginRequest.getUsername(), loginRequest.getPassword())
            );

            SecurityContextHolder.getContext().setAuthentication(authentication);

            String jwt = tokenProvider.generateToken(authentication);

            if (user != null) {
                // Reset failed login count on successful login
                user.setFailedLoginCount(0);
                user.setLockedUntil(null);
                user.setLastLoginAt(OffsetDateTime.now());
                user.setLastLoginIp(ipAddress);
                userRepository.save(user);

                logEvent(user, "LOGIN_SUCCESS", "User", user.getId().toString(), ipAddress, "SUCCESS", null);
                
                return new LoginResponse(jwt, "Bearer", mapToAuthUserDto(user));
            } else {
                throw new BadCredentialsException("Invalid credentials");
            }

        } catch (BadCredentialsException ex) {
            if (user != null) {
                handleFailedLogin(user, ipAddress);
            }
            // Always throw generic exception
            throw new BadCredentialsException("Invalid credentials");
        }
    }

    private void checkUserLockoutStatus(User user) {
        if (user.getLockedUntil() != null && user.getLockedUntil().isAfter(OffsetDateTime.now())) {
            throw new LockedException("User account is locked. Try again later.");
        } else if (user.getLockedUntil() != null && user.getLockedUntil().isBefore(OffsetDateTime.now())) {
            // Lock expired, unlock user
            user.setLockedUntil(null);
            user.setFailedLoginCount(0);
            userRepository.save(user);
        }
    }

    private void handleFailedLogin(User user, String ipAddress) {
        int failedAttempts = user.getFailedLoginCount() + 1;
        user.setFailedLoginCount(failedAttempts);

        if (failedAttempts >= maxFailedLoginAttempts) {
            user.setLockedUntil(OffsetDateTime.now().plusMinutes(lockoutDurationMinutes));
            logEvent(user, "ACCOUNT_LOCKED", "User", user.getId().toString(), ipAddress, "SUCCESS", Map.of("reason", "Max failed attempts reached"));
        }

        userRepository.save(user);
        logEvent(user, "LOGIN_FAILURE", "User", user.getId().toString(), ipAddress, "FAILURE", Map.of("failedAttempts", failedAttempts));
    }

    @Transactional(readOnly = true)
    public AuthUserDto getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equals(authentication.getPrincipal())) {
            return null;
        }

        String username = authentication.getName();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + username));

        return mapToAuthUserDto(user);
    }
    
    @Transactional
    public void logout(String ipAddress) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated() && !"anonymousUser".equals(authentication.getPrincipal())) {
             userRepository.findByUsername(authentication.getName()).ifPresent(user -> {
                 logEvent(user, "LOGOUT", "User", user.getId().toString(), ipAddress, "SUCCESS", null);
             });
        }
    }

    private AuthUserDto mapToAuthUserDto(User user) {
        AuthUserDto dto = new AuthUserDto();
        dto.setId(user.getId().toString());
        dto.setUsername(user.getUsername());
        dto.setEmail(user.getEmail());
        dto.setDisplayName(user.getDisplayName());
        dto.setDepartment(user.getDepartment());
        dto.setStatus(user.getStatus());
        dto.setMfaEnabled(user.isMfaEnabled());

        List<String> roleNames = user.getRoles().stream()
                .map(r -> r.getName())
                .collect(Collectors.toList());
        dto.setRoles(roleNames);

        List<String> permissionStrs = user.getRoles().stream()
                .flatMap(role -> role.getPermissions().stream())
                .map(p -> p.getResource() + ":" + p.getAction())
                .distinct()
                .collect(Collectors.toList());
        dto.setPermissions(permissionStrs);

        return dto;
    }

    private void logEvent(User user, String action, String resourceType, String resourceId, String ipAddress, String result, Map<String, Object> additionalDetails) {
        AuditLog log = new AuditLog();
        log.setUser(user);
        log.setUserDisplayName(user.getDisplayName());
        log.setAction(action);
        log.setResourceType(resourceType);
        log.setResourceId(resourceId);
        log.setIpAddress(ipAddress);
        log.setResult(result);
        
        if (additionalDetails != null) {
            log.setDetails(additionalDetails);
        } else {
            log.setDetails(new HashMap<>());
        }
        
        auditLogRepository.save(log);
    }
}
