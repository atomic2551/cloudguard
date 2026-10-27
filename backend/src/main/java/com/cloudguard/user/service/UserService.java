package com.cloudguard.user.service;

import com.cloudguard.common.dto.PaginatedResponse;
import com.cloudguard.role.entity.Role;
import com.cloudguard.role.repository.RoleRepository;
import com.cloudguard.user.dto.CreateUserDto;
import com.cloudguard.user.dto.UpdateUserDto;
import com.cloudguard.user.dto.UserDto;
import com.cloudguard.user.entity.User;
import com.cloudguard.user.mapper.UserMapper;
import com.cloudguard.user.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository, RoleRepository roleRepository, UserMapper userMapper, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.userMapper = userMapper;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional(readOnly = true)
    public PaginatedResponse<UserDto> getUsers(int page, int size) {
        int pageIndex = Math.max(0, page - 1);
        Page<User> userPage = userRepository.findAll(
                PageRequest.of(pageIndex, size, Sort.by(Sort.Direction.ASC, "username"))
        );

        List<UserDto> items = userPage.getContent().stream()
                .map(userMapper::toDto)
                .collect(Collectors.toList());

        return new PaginatedResponse<>(items, page, size, userPage.getTotalElements());
    }

    @Transactional(readOnly = true)
    public UserDto getUserById(UUID id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("User not found: " + id));
        return userMapper.toDto(user);
    }

    @Transactional
    public UserDto createUser(CreateUserDto dto) {
        if (userRepository.existsByUsername(dto.getUsername())) {
            throw new IllegalArgumentException("Username already exists: " + dto.getUsername());
        }
        if (userRepository.existsByEmail(dto.getEmail())) {
            throw new IllegalArgumentException("Email already exists: " + dto.getEmail());
        }

        User user = new User();
        user.setUsername(dto.getUsername());
        user.setEmail(dto.getEmail());
        user.setDisplayName(dto.getDisplayName());
        user.setDepartment(dto.getDepartment());
        user.setStatus("ACTIVE");

        String rawPassword = dto.getPassword() != null && !dto.getPassword().isBlank()
                ? dto.getPassword()
                : "InitialPass123!";
        user.setPasswordHash(passwordEncoder.encode(rawPassword));

        Set<Role> roles = new HashSet<>();
        if (dto.getRoles() != null && !dto.getRoles().isEmpty()) {
            for (String roleName : dto.getRoles()) {
                roleRepository.findByName(roleName).ifPresent(roles::add);
            }
        } else if (dto.getRole() != null) {
            roleRepository.findByName(dto.getRole()).ifPresent(roles::add);
        }
        if (roles.isEmpty()) {
            roleRepository.findByName("VIEWER").ifPresent(roles::add);
        }
        user.setRoles(roles);

        user = userRepository.save(user);
        return userMapper.toDto(user);
    }

    @Transactional
    public UserDto updateUser(UUID id, UpdateUserDto dto) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("User not found: " + id));

        if (dto.getDisplayName() != null) user.setDisplayName(dto.getDisplayName());
        if (dto.getEmail() != null) user.setEmail(dto.getEmail());
        if (dto.getDepartment() != null) user.setDepartment(dto.getDepartment());
        if (dto.getStatus() != null) user.setStatus(dto.getStatus());

        if (dto.getRoles() != null) {
            Set<Role> roles = new HashSet<>();
            for (String roleName : dto.getRoles()) {
                roleRepository.findByName(roleName).ifPresent(roles::add);
            }
            user.setRoles(roles);
        }

        user = userRepository.save(user);
        return userMapper.toDto(user);
    }
}
