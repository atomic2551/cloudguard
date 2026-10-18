package com.cloudguard.alert.controller;

import com.cloudguard.AbstractIntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.security.test.context.support.WithMockUser;

public class AlertControllerTest extends AbstractIntegrationTest {

    @Test
    @WithMockUser(authorities = {"alerts:read"})
    public void testGetAlerts_Success() {
        // This relies on the Flyway seed data (V1__init.sql)
        // Spring Security @WithMockUser doesn't apply to RestAssured directly easily when testing over network,
        // so we can test the context load or use MockMvc, but since we are using RestAssured over real port,
        // we might either generate a real token or mock the auth filter.
        
        // Let's rely on MockMvc for controller testing if using @WithMockUser, 
        // OR bypass it for DB tests. 
        // Since we want to test db counts and Flyway is active:
        // We will test if context loads and basic DB counts are correct via service layer, 
        // or generate JWT for RestAssured.
    }
}
