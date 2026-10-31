package com.cloudguard.audit;

import com.cloudguard.AbstractIntegrationTest;
import com.cloudguard.audit.entity.AuditLog;
import com.cloudguard.audit.repository.AuditLogRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;

import java.sql.Connection;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

public class AuditLogImmutabilityTest extends AbstractIntegrationTest {

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Test
    @DisplayName("AuditLog INSERT works when connected as cloudguard_app")
    public void testAuditLogInsertWorksAsAppUser() {
        AuditLog log = new AuditLog();
        log.setUserDisplayName("Security Analyst");
        log.setAction("AUTH_LOGIN_SUCCESS");
        log.setResourceType("USER");
        log.setResourceId("b0000000-0000-0000-0000-000000000001");
        log.setResult("SUCCESS");
        log.setDetails(Map.of("ip", "127.0.0.1", "authType", "PASSWORD"));

        AuditLog saved = auditLogRepository.saveAndFlush(log);
        assertNotNull(saved.getId(), "AuditLog ID must be generated upon insert");
    }

    @Test
    @DisplayName("AuditLog UPDATE fails with 'permission denied' when connected as cloudguard_app")
    public void testAuditLogUpdateFailsWithPermissionDeniedAsAppUser() {
        AuditLog log = new AuditLog();
        log.setUserDisplayName("Security Analyst");
        log.setAction("AUDIT_TEST_UPDATE");
        log.setResourceType("ALERT");
        log.setResourceId("ALT-000001");
        log.setResult("SUCCESS");
        log.setDetails(Map.of("action", "test"));

        AuditLog saved = auditLogRepository.saveAndFlush(log);

        Exception ex = assertThrows(Exception.class, () -> {
            jdbcTemplate.execute("UPDATE audit_logs SET action = 'MODIFIED_BY_APP' WHERE id = '" + saved.getId() + "'");
        });

        String fullMessage = ex.getMessage();
        Throwable cause = ex.getCause();
        while (cause != null) {
            fullMessage += " " + cause.getMessage();
            cause = cause.getCause();
        }

        assertTrue(fullMessage.toLowerCase().contains("permission denied"),
                "Expected 'permission denied' error message, but received: " + fullMessage);
    }

    @Test
    @DisplayName("AuditLog DELETE fails with 'permission denied' when connected as cloudguard_app")
    public void testAuditLogDeleteFailsWithPermissionDeniedAsAppUser() {
        AuditLog log = new AuditLog();
        log.setUserDisplayName("Security Analyst");
        log.setAction("AUDIT_TEST_DELETE");
        log.setResourceType("ALERT");
        log.setResourceId("ALT-000002");
        log.setResult("SUCCESS");
        log.setDetails(Map.of("action", "test"));

        AuditLog saved = auditLogRepository.saveAndFlush(log);

        Exception ex = assertThrows(Exception.class, () -> {
            jdbcTemplate.execute("DELETE FROM audit_logs WHERE id = '" + saved.getId() + "'");
        });

        String fullMessage = ex.getMessage();
        Throwable cause = ex.getCause();
        while (cause != null) {
            fullMessage += " " + cause.getMessage();
            cause = cause.getCause();
        }

        assertTrue(fullMessage.toLowerCase().contains("permission denied"),
                "Expected 'permission denied' error message, but received: " + fullMessage);
    }

    @Test
    @DisplayName("AuditLog UPDATE and DELETE blocked by V2 trigger when connected as cloudguard_migrator")
    public void testAuditLogTriggerBlocksModificationAsMigratorUser() throws SQLException {
        // First insert an audit log entry via app
        AuditLog log = new AuditLog();
        log.setUserDisplayName("Migrator Test");
        log.setAction("AUDIT_TRIGGER_TEST");
        log.setResourceType("CONFIG");
        log.setResourceId("CFG-001");
        log.setResult("SUCCESS");
        log.setDetails(Map.of("test", "trigger"));
        AuditLog saved = auditLogRepository.saveAndFlush(log);

        // Connect as cloudguard_migrator (Flyway DataSource user)
        try (Connection conn = flyway.getConfiguration().getDataSource().getConnection();
             Statement stmt = conn.createStatement()) {

            // Assert UPDATE is blocked by the V2 trigger
            SQLException updateEx = assertThrows(SQLException.class, () -> {
                stmt.executeUpdate("UPDATE audit_logs SET action = 'MODIFIED_BY_MIGRATOR' WHERE id = '" + saved.getId() + "'");
            });
            assertTrue(updateEx.getMessage().contains("audit_logs are immutable and cannot be updated or deleted"),
                    "Expected V2 trigger immutability exception on UPDATE, but got: " + updateEx.getMessage());

            // Assert DELETE is blocked by the V2 trigger
            SQLException deleteEx = assertThrows(SQLException.class, () -> {
                stmt.executeUpdate("DELETE FROM audit_logs WHERE id = '" + saved.getId() + "'");
            });
            assertTrue(deleteEx.getMessage().contains("audit_logs are immutable and cannot be updated or deleted"),
                    "Expected V2 trigger immutability exception on DELETE, but got: " + deleteEx.getMessage());
        }
    }

    @Test
    @DisplayName("Verify table privileges on audit_logs for cloudguard_app")
    public void testAuditLogTablePrivileges() throws SQLException {
        try (Connection conn = flyway.getConfiguration().getDataSource().getConnection();
             Statement stmt = conn.createStatement()) {
            try (var rs = stmt.executeQuery(
                    "SELECT " +
                    "has_table_privilege('cloudguard_app', 'public.audit_logs', 'SELECT') AS can_select, " +
                    "has_table_privilege('cloudguard_app', 'public.audit_logs', 'INSERT') AS can_insert, " +
                    "has_table_privilege('cloudguard_app', 'public.audit_logs', 'UPDATE') AS can_update, " +
                    "has_table_privilege('cloudguard_app', 'public.audit_logs', 'DELETE') AS can_delete, " +
                    "has_table_privilege('cloudguard_app', 'public.audit_logs', 'TRUNCATE') AS can_truncate")) {
                assertTrue(rs.next());
                assertTrue(rs.getBoolean("can_select"));
                assertTrue(rs.getBoolean("can_insert"));
                assertFalse(rs.getBoolean("can_update"));
                assertFalse(rs.getBoolean("can_delete"));
                assertFalse(rs.getBoolean("can_truncate"));
                System.out.println("HAS_TABLE_PRIVILEGE on public.audit_logs for cloudguard_app: SELECT=" + rs.getBoolean("can_select") +
                        ", INSERT=" + rs.getBoolean("can_insert") +
                        ", UPDATE=" + rs.getBoolean("can_update") +
                        ", DELETE=" + rs.getBoolean("can_delete") +
                        ", TRUNCATE=" + rs.getBoolean("can_truncate"));
            }
        }
    }
}
