package com.cloudguard.auth.service;

import com.cloudguard.audit.entity.AuditLog;
import com.cloudguard.audit.repository.AuditLogRepository;
import com.cloudguard.auth.dto.AuthUserDto;
import com.cloudguard.auth.dto.LoginRequest;
import com.cloudguard.auth.dto.LoginResponse;
import com.cloudguard.security.jwt.JwtTokenProvider;
import com.cloudguard.user.entity.User;
import com.cloudguard.user.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Service
public class AuthenticationService {

    private static final Logger log = LoggerFactory.getLogger(AuthenticationService.class);

    /** Maximum number of IP:user entries kept in-memory before eviction. */
    private static final int IP_USER_ATTEMPTS_MAX_SIZE = 10_000;

    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider tokenProvider;
    private final UserRepository userRepository;
    private final AuditLogRepository auditLogRepository;
    private final LoginFailureBookkeeper loginFailureBookkeeper;

    @Value("${cloudguard.security.max-failed-login-attempts:5}")
    private int maxFailedLoginAttempts;

    @Value("${cloudguard.security.lockout-duration-minutes:15}")
    private int lockoutDurationMinutes;

    public AuthenticationService(AuthenticationManager authenticationManager,
                                 JwtTokenProvider tokenProvider,
                                 UserRepository userRepository,
                                 AuditLogRepository auditLogRepository,
                                 LoginFailureBookkeeper loginFailureBookkeeper) {
        this.authenticationManager = authenticationManager;
        this.tokenProvider = tokenProvider;
        this.userRepository = userRepository;
        this.auditLogRepository = auditLogRepository;
        this.loginFailureBookkeeper = loginFailureBookkeeper;
    }

    private final ConcurrentHashMap<String, IpUserAttempt> ipUserAttempts = new ConcurrentHashMap<>();

    static class IpUserAttempt {
        int attempts = 0;
        OffsetDateTime lockedUntil = null;
        OffsetDateTime lastAttemptAt = OffsetDateTime.now();
    }

    /** Visible for testing. Returns the current number of in-memory rate-limit entries. */
    public int getIpUserAttemptsSize() {
        return ipUserAttempts.size();
    }

    public LoginResponse authenticateUser(LoginRequest loginRequest, String ipAddress) {
        String rateLimitKey = (ipAddress != null ? ipAddress : "unknown") + ":" + loginRequest.getUsername().trim().toLowerCase();

        // --- TTL cleanup + size cap ---
        evictExpiredEntries();

        IpUserAttempt ipAttempt = ipUserAttempts.get(rateLimitKey);
        if (ipAttempt != null && ipAttempt.lockedUntil != null) {
            if (ipAttempt.lockedUntil.isAfter(OffsetDateTime.now())) {
                throw new LockedException("User account is locked. Try again later.");
            } else {
                ipUserAttempts.remove(rateLimitKey);
            }
        }

        // Find user manually first to check DB lockout status
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
                // Reset failed login count on successful login — clear in-memory entry
                ipUserAttempts.remove(rateLimitKey);

                // Transactional success bookkeeping + audit log (no outer transaction needed)
                AuthUserDto authUserDto = loginFailureBookkeeper.recordSuccess(user, ipAddress);
                
                return new LoginResponse(jwt, "Bearer", authUserDto);
            } else {
                throw new BadCredentialsException("Invalid username or password");
            }

        } catch (BadCredentialsException ex) {
            // In-memory rate limiting
            IpUserAttempt attempt = ipUserAttempts.computeIfAbsent(rateLimitKey, k -> new IpUserAttempt());
            attempt.attempts++;
            attempt.lastAttemptAt = OffsetDateTime.now();
            if (attempt.attempts >= maxFailedLoginAttempts) {
                attempt.lockedUntil = OffsetDateTime.now().plusMinutes(lockoutDurationMinutes);
            }
            evictExpiredEntries();

            // Database bookkeeping in a REQUIRES_NEW transaction so it
            // survives the rollback caused by re-throwing BadCredentialsException.
            if (user != null) {
                loginFailureBookkeeper.recordFailure(
                        user, ipAddress, maxFailedLoginAttempts, lockoutDurationMinutes);
            }

            // Always throw generic exception
            throw new BadCredentialsException("Invalid username or password");
        }
    }

    public void resetLockoutState() {
        ipUserAttempts.clear();
    }

    /**
     * Visible for testing. Records an attempt for a given IP and username and runs eviction.
     */
    public void recordIpUserAttempt(String ipAddress, String username) {
        String rateLimitKey = (ipAddress != null ? ipAddress : "unknown") + ":" + username.trim().toLowerCase();
        IpUserAttempt attempt = ipUserAttempts.computeIfAbsent(rateLimitKey, k -> new IpUserAttempt());
        attempt.attempts++;
        attempt.lastAttemptAt = OffsetDateTime.now();
        if (attempt.attempts >= maxFailedLoginAttempts) {
            attempt.lockedUntil = OffsetDateTime.now().plusMinutes(lockoutDurationMinutes);
        }
        evictExpiredEntries();
    }

    /**
     * Visible for testing. Injects a stale rate-limit entry for testing TTL eviction.
     */
    public void recordStaleIpUserAttemptForTesting(String ipAddress, String username, int minutesAgo) {
        String rateLimitKey = (ipAddress != null ? ipAddress : "unknown") + ":" + username.trim().toLowerCase();
        IpUserAttempt attempt = new IpUserAttempt();
        attempt.attempts = 1;
        attempt.lastAttemptAt = OffsetDateTime.now().minusMinutes(minutesAgo);
        attempt.lockedUntil = null;
        ipUserAttempts.put(rateLimitKey, attempt);
    }

    /**
     * Visible for testing. Runs TTL and capacity eviction.
     */
    public void runEvictionForTesting() {
        evictExpiredEntries();
    }

    /**
     * Remove entries whose lockout has expired AND whose last attempt is older
     * than (lockoutDurationMinutes). Also caps map size at IP_USER_ATTEMPTS_MAX_SIZE
     * by evicting the oldest entries when the cap is exceeded.
     */
    private void evictExpiredEntries() {
        OffsetDateTime now = OffsetDateTime.now();
        OffsetDateTime ttlCutoff = now.minusMinutes(lockoutDurationMinutes);

        Iterator<Map.Entry<String, IpUserAttempt>> it = ipUserAttempts.entrySet().iterator();
        while (it.hasNext()) {
            Map.Entry<String, IpUserAttempt> entry = it.next();
            IpUserAttempt a = entry.getValue();
            // Expired lockout AND last attempt older than TTL → remove
            boolean lockoutExpired = a.lockedUntil == null || a.lockedUntil.isBefore(now);
            boolean stale = a.lastAttemptAt.isBefore(ttlCutoff);
            if (lockoutExpired && stale) {
                it.remove();
            }
        }

        // Hard cap: if still over max size, evict oldest entries
        if (ipUserAttempts.size() > IP_USER_ATTEMPTS_MAX_SIZE) {
            ipUserAttempts.entrySet().stream()
                    .sorted((a, b) -> a.getValue().lastAttemptAt.compareTo(b.getValue().lastAttemptAt))
                    .limit(ipUserAttempts.size() - IP_USER_ATTEMPTS_MAX_SIZE)
                    .map(Map.Entry::getKey)
                    .forEach(ipUserAttempts::remove);
        }
    }

    private void checkUserLockoutStatus(User user) {
        if (user.getLockedUntil() != null && user.getLockedUntil().isAfter(OffsetDateTime.now())) {
            throw new LockedException("User account is locked. Try again later.");
        }
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

