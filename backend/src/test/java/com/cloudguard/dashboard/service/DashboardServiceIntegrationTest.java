package com.cloudguard.dashboard.service;

import com.cloudguard.AbstractIntegrationTest;
import com.cloudguard.dashboard.dto.DashboardSummaryDto;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.annotation.Transactional;

import static org.junit.jupiter.api.Assertions.*;

@Transactional
public class DashboardServiceIntegrationTest extends AbstractIntegrationTest {

    @Autowired
    private DashboardService dashboardService;

    @Test
    public void testDashboardSummaryAggregation() {
        DashboardSummaryDto summary = dashboardService.getSummary();
        
        assertNotNull(summary);
        assertNotNull(summary.getMetrics());
        assertNotNull(summary.getCategoryScores());
        assertTrue(summary.getMetrics().getTotalAlerts() > 0); 
        assertEquals(82, summary.getOverallSecurityScore());
    }
}
