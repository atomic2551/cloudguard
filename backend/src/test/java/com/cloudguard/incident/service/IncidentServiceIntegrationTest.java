package com.cloudguard.incident.service;

import com.cloudguard.AbstractIntegrationTest;
import com.cloudguard.common.dto.PaginatedResponse;
import com.cloudguard.incident.dto.IncidentDto;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.annotation.Transactional;

import static org.junit.jupiter.api.Assertions.*;

@Transactional
public class IncidentServiceIntegrationTest extends AbstractIntegrationTest {

    @Autowired
    private IncidentService incidentService;

    @Test
    public void testGetIncidentsPaginationAndAlertCount() {
        PaginatedResponse<IncidentDto> response = incidentService.getIncidents(1, 10, null, "INVESTIGATING", null);
        
        assertNotNull(response);
        assertTrue(response.getTotalElements() > 0);
        assertEquals("INVESTIGATING", response.getItems().get(0).getStatus());
        
        // Verify alert count works without N+1 crashes
        assertNotNull(response.getItems().get(0).getAlertCount());
    }
}
