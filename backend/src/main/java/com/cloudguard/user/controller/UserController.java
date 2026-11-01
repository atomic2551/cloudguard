package com.cloudguard.user.controller;

import com.cloudguard.common.dto.PaginatedResponse;
import com.cloudguard.common.response.ApiResponse;
import com.cloudguard.user.dto.CreateUserDto;
import com.cloudguard.user.dto.UpdateUserDto;
import com.cloudguard.user.dto.UserDto;
import com.cloudguard.user.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping
    @PreAuthorize("hasAnyAuthority('users:read', 'ROLE_ADMIN')")
    public PaginatedResponse<UserDto> getUsers(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size) {
        return userService.getUsers(page, size);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('users:read', 'ROLE_ADMIN')")
    public ResponseEntity<Map<String, UserDto>> getUserById(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(userService.getUserById(id)));
    }

    @PostMapping
    @PreAuthorize("hasAnyAuthority('users:write', 'ROLE_ADMIN')")
    public ResponseEntity<Map<String, UserDto>> createUser(@Valid @RequestBody CreateUserDto dto) {
        return ResponseEntity.ok(ApiResponse.success(userService.createUser(dto)));
    }

    @PatchMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('users:write', 'ROLE_ADMIN')")
    public ResponseEntity<Map<String, UserDto>> updateUser(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateUserDto dto) {
        return ResponseEntity.ok(ApiResponse.success(userService.updateUser(id, dto)));
    }
}
