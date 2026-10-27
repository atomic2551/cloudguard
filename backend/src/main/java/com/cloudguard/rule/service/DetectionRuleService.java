package com.cloudguard.rule.service;

import com.cloudguard.common.dto.PaginatedResponse;
import com.cloudguard.rule.dto.CreateDetectionRuleDto;
import com.cloudguard.rule.dto.DetectionRuleDto;
import com.cloudguard.rule.dto.UpdateDetectionRuleDto;
import com.cloudguard.rule.entity.DetectionRule;
import com.cloudguard.rule.mapper.DetectionRuleMapper;
import com.cloudguard.rule.repository.DetectionRuleRepository;
import com.cloudguard.user.entity.User;
import com.cloudguard.user.repository.UserRepository;
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
public class DetectionRuleService {

    private final DetectionRuleRepository repository;
    private final DetectionRuleMapper mapper;
    private final UserRepository userRepository;

    public DetectionRuleService(DetectionRuleRepository repository, DetectionRuleMapper mapper, UserRepository userRepository) {
        this.repository = repository;
        this.mapper = mapper;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public PaginatedResponse<DetectionRuleDto> getRules(int page, int size) {
        int pageIndex = Math.max(0, page - 1);
        Page<DetectionRule> rulePage = repository.findAll(
                PageRequest.of(pageIndex, size, Sort.by(Sort.Direction.DESC, "createdAt"))
        );

        List<DetectionRuleDto> items = rulePage.getContent().stream()
                .map(mapper::toDto)
                .collect(Collectors.toList());

        return new PaginatedResponse<>(items, page, size, rulePage.getTotalElements());
    }

    @Transactional(readOnly = true)
    public DetectionRuleDto getRuleById(UUID id) {
        DetectionRule rule = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Detection rule not found: " + id));
        return mapper.toDto(rule);
    }

    @Transactional
    public DetectionRuleDto createRule(CreateDetectionRuleDto dto, String currentUsername) {
        User creator = currentUsername != null ? userRepository.findByUsername(currentUsername).orElse(null) : null;

        DetectionRule rule = new DetectionRule();
        rule.setName(dto.getName());
        rule.setDescription(dto.getDescription());
        rule.setRuleType(dto.getRuleType());
        rule.setCategory(dto.getCategory());
        rule.setSeverity(dto.getSeverity());
        rule.setEnabled(dto.isEnabled());
        rule.setLogicDefinition(dto.getLogicDefinition());
        rule.setTriggerDescription(dto.getTriggerDescription());
        rule.setMitreTechniqueId(dto.getMitreTechniqueId());
        rule.setMitreTactic(dto.getMitreTactic());
        rule.setCooldownMinutes(dto.getCooldownMinutes());
        rule.setCreatedBy(creator);

        rule = repository.save(rule);
        return mapper.toDto(rule);
    }

    @Transactional
    public DetectionRuleDto updateRule(UUID id, UpdateDetectionRuleDto dto) {
        DetectionRule rule = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Detection rule not found: " + id));

        if (dto.getName() != null) rule.setName(dto.getName());
        if (dto.getDescription() != null) rule.setDescription(dto.getDescription());
        if (dto.getRuleType() != null) rule.setRuleType(dto.getRuleType());
        if (dto.getCategory() != null) rule.setCategory(dto.getCategory());
        if (dto.getSeverity() != null) rule.setSeverity(dto.getSeverity());
        if (dto.getEnabled() != null) rule.setEnabled(dto.getEnabled());
        if (dto.getLogicDefinition() != null) rule.setLogicDefinition(dto.getLogicDefinition());
        if (dto.getTriggerDescription() != null) rule.setTriggerDescription(dto.getTriggerDescription());
        if (dto.getMitreTechniqueId() != null) rule.setMitreTechniqueId(dto.getMitreTechniqueId());
        if (dto.getMitreTactic() != null) rule.setMitreTactic(dto.getMitreTactic());
        if (dto.getCooldownMinutes() != null) rule.setCooldownMinutes(dto.getCooldownMinutes());

        rule = repository.save(rule);
        return mapper.toDto(rule);
    }

    @Transactional
    public void deleteRule(UUID id) {
        if (!repository.existsById(id)) {
            throw new EntityNotFoundException("Detection rule not found: " + id);
        }
        repository.deleteById(id);
    }
}
