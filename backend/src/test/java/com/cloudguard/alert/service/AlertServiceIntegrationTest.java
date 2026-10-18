package com.cloudguard.alert.service;

import com.cloudguard.AbstractIntegrationTest;
import com.cloudguard.alert.dto.AlertDto;
import com.cloudguard.common.dto.PaginatedResponse;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.annotation.Transactional;

import static org.junit.jupiter.api.Assertions.*;

@Transactional
public class AlertServiceIntegrationTest extends AbstractIntegrationTest {

    @Autowired
    private AlertService alertService;

    @Test
    public void testGetAlertsPaginationAndFiltering() {
        // V1__init.sql provides seed data for alerts
        PaginatedResponse<AlertDto> response = alertService.getAlerts(1, 10, "CRITICAL", null, null);
        
        assertNotNull(response);
        assertTrue(response.getTotalElements() > 0);
        assertEquals("CRITICAL", response.getItems().get(0).getSeverity());
    }
    
    @Test
    public void testGetAlertByIdOrNumber() {
        // AlertNumber ALT-000001 is in seed data
        AlertDto dto = alertService.getAlertByIdOrNumber("ALT-000001");
        assertNotNull(dto);
        assertEquals("ALT-000001", dto.getAlertNumber());
    }
}
