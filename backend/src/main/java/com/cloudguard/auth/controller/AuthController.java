package com.cloudguard.auth.controller;

import com.cloudguard.auth.dto.AuthUserDto;
import com.cloudguard.auth.dto.LoginRequest;
import com.cloudguard.auth.dto.LoginResponse;
import com.cloudguard.auth.service.AuthenticationService;
import com.cloudguard.common.response.ApiResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthenticationService authenticationService;

    @Value("${cloudguard.cookie.secure:true}")
    private boolean cookieSecure;

    @Value("${cloudguard.jwt.expiration-ms:3600000}")
    private long jwtExpirationMs;

    @Value("${cloudguard.trusted-proxies:127.0.0.1,::1,0:0:0:0:0:0:0:1}")
    private String trustedProxies;

    public AuthController(AuthenticationService authenticationService) {
        this.authenticationService = authenticationService;
    }

    public String resolveClientIp(HttpServletRequest request) {
        String remoteAddr = request.getRemoteAddr();
        Set<String> trusted = Arrays.stream(trustedProxies.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toSet());

        if (remoteAddr != null && trusted.contains(remoteAddr)) {
            String forwardedFor = request.getHeader("X-Forwarded-For");
            if (forwardedFor != null && !forwardedFor.isBlank()) {
                String[] parts = forwardedFor.split(",");
                for (int i = parts.length - 1; i >= 0; i--) {
                    String candidate = parts[i].trim();
                    if (!candidate.isEmpty() && !trusted.contains(candidate)) {
                        return candidate;
                    }
                }
            }
        }
        return remoteAddr != null ? remoteAddr : "unknown";
    }

    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@Valid @RequestBody LoginRequest loginRequest, HttpServletRequest request) {
        String ipAddress = resolveClientIp(request);
        LoginResponse response = authenticationService.authenticateUser(loginRequest, ipAddress);

        long maxAgeSeconds = jwtExpirationMs / 1000;
        ResponseCookie cookie = ResponseCookie.from("cg_token", response.getToken())
                .httpOnly(true)
                .secure(cookieSecure)
                .path("/")
                .maxAge(maxAgeSeconds)
                .sameSite("Strict")
                .build();

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .body(ApiResponse.success(Map.of("user", response.getUser())));
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser() {
        AuthUserDto currentUser = authenticationService.getCurrentUser();
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok(ApiResponse.success(currentUser));
    }

    @GetMapping("/csrf")
    public ResponseEntity<Map<String, String>> getCsrfToken(HttpServletRequest request) {
        CsrfToken csrfToken = (CsrfToken) request.getAttribute(CsrfToken.class.getName());
        String token = csrfToken != null ? csrfToken.getToken() : "";

        ResponseCookie cookie = ResponseCookie.from("XSRF-TOKEN", token)
                .path("/")
                .httpOnly(false)
                .secure(cookieSecure)
                .sameSite("Strict")
                .build();

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .body(Map.of("csrfToken", token));
    }

    @PostMapping("/logout")
    public ResponseEntity<Map<String, Boolean>> logout(HttpServletRequest request) {
        String ipAddress = resolveClientIp(request);
        authenticationService.logout(ipAddress);

        ResponseCookie clearCookie = ResponseCookie.from("cg_token", "")
                .httpOnly(true)
                .secure(cookieSecure)
                .path("/")
                .maxAge(0)
                .sameSite("Strict")
                .build();

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, clearCookie.toString())
                .body(Map.of("success", true));
    }
}
