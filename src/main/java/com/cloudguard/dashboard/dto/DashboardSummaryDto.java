package com.cloudguard.dashboard.dto;
import java.util.List;
import java.util.Map;
import com.cloudguard.common.dto.AlertSeverity;

public record DashboardSummaryDto(
    Integer overallSecurityScore,
    Map<String, Integer> categoryScores,
    Metrics metrics,
    List<AlertTrend> alertsTrend,
    List<SeverityDistribution> severityDistribution,
    List<Recommendation> topRecommendations
) {
    public record Metrics(Long totalAlerts, Long criticalAlerts, Long highAlerts, Long openIncidents, Long investigatingIncidents, Long criticalFindings, Long openFindings, Long activeCloudAccounts) {}
    public record AlertTrend(String date, Long critical, Long high, Long medium, Long low) {}
    public record SeverityDistribution(String name, Long value, String color) {}
    public record Recommendation(AlertSeverity priority, String text, String effort) {}
}
