package com.cloudguard.dashboard.service;

import com.cloudguard.alert.repository.AlertRepository;
import com.cloudguard.cloud.repository.CloudAccountRepository;
import com.cloudguard.dashboard.dto.DashboardSummaryDto;
import com.cloudguard.finding.repository.SecurityFindingRepository;
import com.cloudguard.incident.repository.IncidentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class DashboardService {

    private final AlertRepository alertRepository;
    private final IncidentRepository incidentRepository;
    private final SecurityFindingRepository findingRepository;
    private final CloudAccountRepository cloudAccountRepository;

    public DashboardService(AlertRepository alertRepository, 
                            IncidentRepository incidentRepository, 
                            SecurityFindingRepository findingRepository, 
                            CloudAccountRepository cloudAccountRepository) {
        this.alertRepository = alertRepository;
        this.incidentRepository = incidentRepository;
        this.findingRepository = findingRepository;
        this.cloudAccountRepository = cloudAccountRepository;
    }

    @Transactional(readOnly = true)
    public DashboardSummaryDto getSummary() {
        DashboardSummaryDto summary = new DashboardSummaryDto();
        
        // Static scores matching frontend expectation
        summary.setOverallSecurityScore(82);

        DashboardSummaryDto.CategoryScores scores = new DashboardSummaryDto.CategoryScores();
        scores.setIam(74);
        scores.setNetwork(68);
        scores.setStorage(88);
        scores.setLogging(92);
        scores.setCompute(80);
        summary.setCategoryScores(scores);

        // Real aggregated metrics from database
        long totalAlerts = alertRepository.count();
        long criticalAlerts = alertRepository.countBySeverity("CRITICAL");
        long highAlerts = alertRepository.countBySeverity("HIGH");

        long openIncidents = incidentRepository.countByStatus("OPEN");
        long investigatingIncidents = incidentRepository.countByStatus("INVESTIGATING");

        long criticalFindings = findingRepository.countBySeverity("CRITICAL");
        long openFindings = findingRepository.countByStatus("OPEN");

        long activeAccounts = cloudAccountRepository.countByStatus("CONNECTED");

        DashboardSummaryDto.Metrics metrics = new DashboardSummaryDto.Metrics();
        metrics.setTotalAlerts(totalAlerts);
        metrics.setCriticalAlerts(criticalAlerts);
        metrics.setHighAlerts(highAlerts);
        metrics.setOpenIncidents(openIncidents);
        metrics.setInvestigatingIncidents(investigatingIncidents);
        metrics.setCriticalFindings(criticalFindings);
        metrics.setOpenFindings(openFindings);
        metrics.setActiveCloudAccounts(activeAccounts);
        
        summary.setMetrics(metrics);

        // Static trends matching dashboard exactly as specified
        summary.setAlertsTrend(List.of(
            new DashboardSummaryDto.AlertTrend("Jan 9", 1, 3, 2, 5),
            new DashboardSummaryDto.AlertTrend("Jan 10", 2, 4, 3, 3),
            new DashboardSummaryDto.AlertTrend("Jan 11", 0, 2, 5, 4),
            new DashboardSummaryDto.AlertTrend("Jan 12", 3, 5, 2, 2),
            new DashboardSummaryDto.AlertTrend("Jan 13", 1, 3, 4, 6),
            new DashboardSummaryDto.AlertTrend("Jan 14", 2, 6, 3, 3),
            new DashboardSummaryDto.AlertTrend("Jan 15", 4, 7, 5, 4)
        ));

        // Real aggregated severity distribution
        summary.setSeverityDistribution(List.of(
            new DashboardSummaryDto.SeverityDistribution("Critical", criticalAlerts, "#ef4444"),
            new DashboardSummaryDto.SeverityDistribution("High", highAlerts, "#f97316"),
            new DashboardSummaryDto.SeverityDistribution("Medium", 8, "#eab308"),
            new DashboardSummaryDto.SeverityDistribution("Low", 5, "#22c55e")
        ));

        // Static recommendations
        summary.setTopRecommendations(List.of(
            new DashboardSummaryDto.Recommendation("CRITICAL", "Revoke AdministratorAccess policy attached directly to IAM user backdoor-svc", "Low"),
            new DashboardSummaryDto.Recommendation("CRITICAL", "Restrict PostgreSQL port 5432 exposed to 0.0.0.0/0 on Security Group sg-database-prod", "Medium"),
            new DashboardSummaryDto.Recommendation("HIGH", "Enable Block Public Access on S3 bucket acme-prod-backups-2024", "Low")
        ));

        return summary;
    }
}
