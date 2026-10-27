package com.cloudguard.audit;

import com.cloudguard.AbstractIntegrationTest;
import com.cloudguard.audit.entity.AuditLog;
import com.cloudguard.audit.repository.AuditLogRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataAccessException;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertThrows;

public class AuditLogImmutabilityTest extends AbstractIntegrationTest {

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Test
    public void testAuditLogCannotBeUpdated() {
        AuditLog log = new AuditLog();
        log.setUserDisplayName("Test Analyst");
        log.setAction("TEST_ACTION");
        log.setResourceType("ALERT");
        log.setResourceId("123");
        log.setResult("SUCCESS");
        log.setDetails(Map.of("key", "val"));

        AuditLog saved = auditLogRepository.saveAndFlush(log);

        saved.setAction("MODIFIED_ACTION");
        assertThrows(DataAccessException.class, () -> {
            auditLogRepository.saveAndFlush(saved);
        });
    }

    @Test
    public void testAuditLogCannotBeDeleted() {
        AuditLog log = new AuditLog();
        log.setUserDisplayName("Test Analyst");
        log.setAction("TEST_DELETE");
        log.setResourceType("ALERT");
        log.setResourceId("456");
        log.setResult("SUCCESS");
        log.setDetails(Map.of("key", "val"));

        AuditLog saved = auditLogRepository.saveAndFlush(log);

        assertThrows(DataAccessException.class, () -> {
            auditLogRepository.delete(saved);
            auditLogRepository.flush();
        });
    }
}
