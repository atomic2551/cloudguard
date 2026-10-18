package com.cloudguard;

import org.junit.jupiter.api.Test;

public class SecurityContextTest extends AbstractIntegrationTest {

    @Test
    public void contextLoads() {
        // Just verify that Spring context boots up perfectly with the Testcontainers DB
        // and flyway migrations map cleanly.
    }
}
