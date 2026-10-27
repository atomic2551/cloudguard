package com.cloudguard.rule.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.Map;

public class CreateDetectionRuleDto {
    @NotBlank(message = "Rule name is required")
    private String name;

    private String description;

    @NotBlank(message = "Rule type is required")
    private String ruleType = "THRESHOLD";

    @NotBlank(message = "Category is required")
    private String category;

    @NotBlank(message = "Severity is required")
    private String severity = "MEDIUM";

    private boolean enabled = true;

    @NotNull(message = "Logic definition is required")
    private Map<String, Object> logicDefinition;

    @NotBlank(message = "Trigger description is required")
    private String triggerDescription;

    private String mitreTechniqueId;
    private String mitreTactic;
    private int cooldownMinutes = 0;

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getRuleType() { return ruleType; }
    public void setRuleType(String ruleType) { this.ruleType = ruleType; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public String getSeverity() { return severity; }
    public void setSeverity(String severity) { this.severity = severity; }
    public boolean isEnabled() { return enabled; }
    public void setEnabled(boolean enabled) { this.enabled = enabled; }
    public Map<String, Object> getLogicDefinition() { return logicDefinition; }
    public void setLogicDefinition(Map<String, Object> logicDefinition) { this.logicDefinition = logicDefinition; }
    public String getTriggerDescription() { return triggerDescription; }
    public void setTriggerDescription(String triggerDescription) { this.triggerDescription = triggerDescription; }
    public String getMitreTechniqueId() { return mitreTechniqueId; }
    public void setMitreTechniqueId(String mitreTechniqueId) { this.mitreTechniqueId = mitreTechniqueId; }
    public String getMitreTactic() { return mitreTactic; }
    public void setMitreTactic(String mitreTactic) { this.mitreTactic = mitreTactic; }
    public int getCooldownMinutes() { return cooldownMinutes; }
    public void setCooldownMinutes(int cooldownMinutes) { this.cooldownMinutes = cooldownMinutes; }
}
