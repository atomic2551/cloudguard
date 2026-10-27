package com.cloudguard.report.service;

import com.cloudguard.alert.repository.AlertRepository;
import com.cloudguard.finding.repository.SecurityFindingRepository;
import com.cloudguard.incident.repository.IncidentRepository;
import com.cloudguard.report.dto.SecurityReportDto;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class ReportService {

    private final AlertRepository alertRepository;
    private final IncidentRepository incidentRepository;
    private final SecurityFindingRepository findingRepository;

    public ReportService(AlertRepository alertRepository, IncidentRepository incidentRepository, SecurityFindingRepository findingRepository) {
        this.alertRepository = alertRepository;
        this.incidentRepository = incidentRepository;
        this.findingRepository = findingRepository;
    }

    @Transactional(readOnly = true)
    public SecurityReportDto generateLatestReport() {
        SecurityReportDto report = new SecurityReportDto();
        report.setId(UUID.randomUUID().toString());
        report.setTitle("Executive Cloud Security & Compliance Audit Report");

        OffsetDateTime now = OffsetDateTime.now();
        report.setPeriodStart(now.minusDays(30).toString());
        report.setPeriodEnd(now.toString());
        report.setGeneratedAt(now.toString());

        long totalAlerts = alertRepository.count();
        long resolvedAlerts = alertRepository.countByStatus("RESOLVED");
        long openIncidents = incidentRepository.countByStatus("OPEN") + incidentRepository.countByStatus("INVESTIGATING");
        long resolvedIncidents = incidentRepository.countByStatus("RESOLVED") + incidentRepository.countByStatus("CLOSED");
        long criticalFindings = findingRepository.countBySeverity("CRITICAL");
        long openFindings = findingRepository.countByStatus("OPEN");

        SecurityReportDto.ReportSummary summary = new SecurityReportDto.ReportSummary();
        summary.setTotalAlerts(totalAlerts);
        summary.setResolvedAlerts(resolvedAlerts);
        summary.setOpenIncidents(openIncidents);
        summary.setResolvedIncidents(resolvedIncidents);
        summary.setCriticalFindings(criticalFindings);
        summary.setOpenFindings(openFindings);
        report.setSummary(summary);

        int deductions = (int) (criticalFindings * 10 + openIncidents * 5);
        int overallScore = Math.max(20, Math.min(100, 100 - deductions));
        report.setOverallScore(overallScore);

        report.setCategoryScores(Map.of(
                "IAM", Math.max(30, 95 - (int) criticalFindings * 8),
                "NETWORK", 88,
                "STORAGE", 92,
                "LOGGING", 96,
                "ENCRYPTION", 85
        ));

        report.setTopRecommendations(List.of(
                new SecurityReportDto.TopRecommendation("CRITICAL", "Remediate exposed Security Group ports (22/SSH, 3389/RDP, 5432/PG)", "1 hour"),
                new SecurityReportDto.TopRecommendation("HIGH", "Enforce Multi-Factor Authentication (MFA) on all IAM user accounts without MFA", "2 hours"),
                new SecurityReportDto.TopRecommendation("MEDIUM", "Rotate IAM access keys older than 90 days across all cloud accounts", "4 hours")
        ));

        return report;
    }
}
