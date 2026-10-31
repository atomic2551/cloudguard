package com.cloudguard;

import io.restassured.RestAssured;
import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.BeforeEach;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.test.context.ActiveProfiles;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
public abstract class AbstractIntegrationTest {

    private static final Logger log = LoggerFactory.getLogger(AbstractIntegrationTest.class);

    @LocalServerPort
    protected int port;

    @Autowired
    protected DataSource dataSource;

    @Autowired
    protected Flyway flyway;

    private static boolean loggedConnections = false;

    @BeforeEach
    public void setUp() {
        RestAssured.port = port;

        if (!loggedConnections) {
            // Verify and log Flyway connection user & database
            try (Connection conn = flyway.getConfiguration().getDataSource().getConnection();
                 Statement stmt = conn.createStatement();
                 ResultSet rs = stmt.executeQuery("SELECT current_user, current_database()")) {
                if (rs.next()) {
                    log.info("FLYWAY TEST CONNECTION: user='{}', database='{}'", rs.getString(1), rs.getString(2));
                }
            } catch (SQLException e) {
                log.error("Failed to verify Flyway test connection", e);
            }

            // Verify and log App DataSource connection user & database
            try (Connection conn = dataSource.getConnection();
                 Statement stmt = conn.createStatement();
                 ResultSet rs = stmt.executeQuery("SELECT current_user, current_database()")) {
                if (rs.next()) {
                    log.info("APP DATASOURCE TEST CONNECTION: user='{}', database='{}'", rs.getString(1), rs.getString(2));
                }
            } catch (SQLException e) {
                log.error("Failed to verify DataSource test connection", e);
            }

            loggedConnections = true;
        }
    }
}
