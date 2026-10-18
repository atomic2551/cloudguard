package com.cloudguard.auth.controller;

import com.cloudguard.auth.dto.AuthUserDto;
import com.cloudguard.auth.dto.LoginRequest;
import com.cloudguard.auth.dto.LoginResponse;
import com.cloudguard.auth.service.AuthenticationService;
import com.cloudguard.common.response.ApiResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthenticationService authenticationService;

    public AuthController(AuthenticationService authenticationService) {
        this.authenticationService = authenticationService;
    }

    @PostMapping("/login")
    public ResponseEntity<Map<String, LoginResponse>> login(@Valid @RequestBody LoginRequest loginRequest, HttpServletRequest request) {
        String ipAddress = request.getRemoteAddr();
        LoginResponse response = authenticationService.authenticateUser(loginRequest, ipAddress);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser() {
        AuthUserDto currentUser = authenticationService.getCurrentUser();
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok(ApiResponse.success(currentUser));
    }

    @PostMapping("/logout")
    public ResponseEntity<Map<String, Boolean>> logout(HttpServletRequest request) {
        String ipAddress = request.getRemoteAddr();
        // Documented limitation: 
        // Since JWT is stateless, server-side logout does not invalidate the token.
        // It merely triggers an audit log. The client must discard the token.
        authenticationService.logout(ipAddress);
        return ResponseEntity.ok(Map.of("success", true));
    }
}
