package com.cloudguard;

import io.restassured.RestAssured;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.utility.DockerImageName;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
@SuppressWarnings("resource")
public abstract class AbstractIntegrationTest {

    @LocalServerPort
    protected int port;

    private static PostgreSQLContainer<?> postgres;

    static {
        try {
            postgres = new PostgreSQLContainer<>(DockerImageName.parse("postgres:15-alpine"))
                    .withDatabaseName("cloudguard_test")
                    .withUsername("test")
                    .withPassword("test");
            postgres.start();
        } catch (Throwable e) {
            System.err.println("Testcontainers Docker failed, falling back to local PostgreSQL: " + e.getMessage());
            postgres = null;
        }
    }

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        if (postgres != null && postgres.isRunning()) {
            registry.add("spring.datasource.url", postgres::getJdbcUrl);
            registry.add("spring.datasource.username", postgres::getUsername);
            registry.add("spring.datasource.password", postgres::getPassword);
            registry.add("spring.flyway.url", postgres::getJdbcUrl);
            registry.add("spring.flyway.user", postgres::getUsername);
            registry.add("spring.flyway.password", postgres::getPassword);
        } else {
            String testDbUrl = System.getProperty("test.db.url",
                    System.getenv().getOrDefault("TEST_DB_URL", "jdbc:postgresql://localhost:5432/cloudguard_test"));
            String testDbUser = System.getProperty("test.db.user",
                    System.getenv().getOrDefault("TEST_DB_USER", "postgres"));
            String testDbPassword = System.getProperty("test.db.password",
                    System.getenv().getOrDefault("TEST_DB_PASSWORD", "postgres"));

            registry.add("spring.datasource.url", () -> testDbUrl);
            registry.add("spring.datasource.username", () -> testDbUser);
            registry.add("spring.datasource.password", () -> testDbPassword);
            registry.add("spring.datasource.driver-class-name", () -> "org.postgresql.Driver");
            registry.add("spring.flyway.url", () -> testDbUrl);
            registry.add("spring.flyway.user", () -> testDbUser);
            registry.add("spring.flyway.password", () -> testDbPassword);
        }
    }

    @BeforeEach
    public void setUp() {
        RestAssured.port = port;
    }
}

