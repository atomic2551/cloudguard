package com.cloudguard.dashboard.service;
import com.cloudguard.dashboard.dto.DashboardSummaryDto;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.Map;
import java.util.List;
import java.util.ArrayList;

@Service
public class DashboardService {
    private final JdbcTemplate jdbcTemplate;
    public DashboardService(JdbcTemplate jdbcTemplate) { this.jdbcTemplate = jdbcTemplate; }

    @Transactional(readOnly = true)
    public DashboardSummaryDto getSummary() {
        Long totalAlerts = jdbcTemplate.queryForObject("SELECT count(*) FROM alerts", Long.class);
        Long critAlerts = jdbcTemplate.queryForObject("SELECT count(*) FROM alerts WHERE severity = 'CRITICAL'", Long.class);
        Long highAlerts = jdbcTemplate.queryForObject("SELECT count(*) FROM alerts WHERE severity = 'HIGH'", Long.class);
        
        Long openIncidents = jdbcTemplate.queryForObject("SELECT count(*) FROM incidents WHERE status = 'OPEN'", Long.class);
        Long invIncidents = jdbcTemplate.queryForObject("SELECT count(*) FROM incidents WHERE status = 'INVESTIGATING'", Long.class);
        
        Long critFindings = jdbcTemplate.queryForObject("SELECT count(*) FROM security_findings WHERE severity = 'CRITICAL' AND status != 'REMEDIATED'", Long.class);
        Long openFindings = jdbcTemplate.queryForObject("SELECT count(*) FROM security_findings WHERE status != 'REMEDIATED'", Long.class);
        
        Long activeCloudAccounts = jdbcTemplate.queryForObject("SELECT count(*) FROM cloud_accounts WHERE status = 'CONNECTED'", Long.class);

        var metrics = new DashboardSummaryDto.Metrics(
            totalAlerts, critAlerts, highAlerts, openIncidents, invIncidents, critFindings, openFindings, activeCloudAccounts
        );
        
        return new DashboardSummaryDto(
            85, // Mock overall score
            Map.of("iam", 90, "network", 80, "storage", 85, "logging", 95, "compute", 75), // Mock category
            metrics,
            new ArrayList<>(), // Return empty lists for trends for now unless explicit SQL added
            new ArrayList<>(),
            new ArrayList<>()
        );
    }
}
