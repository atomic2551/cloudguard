package com.cloudguard.security;

import com.cloudguard.AbstractIntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@AutoConfigureMockMvc
public class RbacIntegrationTest extends AbstractIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    public void unauthenticatedRequests_areRejected() throws Exception {
        mockMvc.perform(get("/api/alerts"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(authorities = {"alerts:read"})
    public void viewerWithAlertsRead_canAccessAlerts() throws Exception {
        mockMvc.perform(get("/api/alerts"))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(authorities = {"alerts:read"})
    public void viewerCannotAccessUsersEndpoint() throws Exception {
        mockMvc.perform(get("/api/users"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(authorities = {"users:read", "ROLE_ADMIN"})
    public void adminCanAccessUsersEndpoint() throws Exception {
        mockMvc.perform(get("/api/users"))
                .andExpect(status().isOk());
    }
}
