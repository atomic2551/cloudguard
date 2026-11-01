package com.cloudguard.rule.repository;

import com.cloudguard.rule.entity.DetectionRule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface DetectionRuleRepository extends JpaRepository<DetectionRule, UUID> {
    long countByEnabled(boolean enabled);
}
