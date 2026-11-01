package com.cloudguard.security;

import com.cloudguard.AbstractIntegrationTest;
import com.cloudguard.audit.repository.AuditLogRepository;
import com.cloudguard.auth.service.AuthenticationService;
import com.cloudguard.user.entity.User;
import com.cloudguard.user.repository.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.OffsetDateTime;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Integration tests verifying:
 * 1. Lockout persistence — failed_login_count, locked_until, and LOGIN_FAILURE
 *    audit rows survive the BadCredentialsException-induced rollback.
 * 2. Expired lockout behavior — (a) wrong password resets count to 1 and nulls lock,
 *    (b) correct password resets count to 0, (c) no deadlock/timeout.
 * 3. Atomic failure increment and concurrent update test (10 parallel requests).
 * 4. ipUserAttempts bounding — TTL cleanup removes stale entries and size never exceeds 10,000.
 */
@AutoConfigureMockMvc
public class LockoutPersistenceIntegrationTest extends AbstractIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private AuthenticationService authenticationService;
    @Autowired private UserRepository userRepository;
    @Autowired private AuditLogRepository auditLogRepository;

    private long auditLogCountBefore;

    @BeforeEach
    @AfterEach
    public void cleanup() {
        authenticationService.resetLockoutState();
        userRepository.findByUsername("sarah.chen").ifPresent(u -> {
            u.setFailedLoginCount(0);
            u.setLockedUntil(null);
            userRepository.save(u);
        });
    }

    @BeforeEach
    public void captureBaseline() {
        auditLogCountBefore = auditLogRepository.findByAction("LOGIN_FAILURE").size();
    }

    // ---- Task 1: Lockout Persistence ----

    @Test
    @DisplayName("B4.6-1: 5 wrong-password logins persist failed_login_count, locked_until, and LOGIN_FAILURE audit rows")
    public void testLockoutDataPersistsAfterBadCredentials() throws Exception {
        String testUser = "sarah.chen";

        // 5 wrong-password login attempts
        for (int i = 0; i < 5; i++) {
            mockMvc.perform(post("/api/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"username\":\"" + testUser + "\",\"password\":\"WrongPassword!\"}")
                            .header("Origin", "http://localhost:3000"))
                    .andExpect(status().isUnauthorized());
        }

        // Verify DB: users table
        User user = userRepository.findByUsername(testUser).orElseThrow();
        System.out.println("TEST EVIDENCE 1 — failed_login_count: " + user.getFailedLoginCount());
        System.out.println("TEST EVIDENCE 1 — locked_until:       " + user.getLockedUntil());
        assertEquals(5, user.getFailedLoginCount(),
                "failed_login_count must be 5 (not rolled back)");
        assertNotNull(user.getLockedUntil(),
                "locked_until must be set (not rolled back)");

        // Verify DB: audit_logs LOGIN_FAILURE rows
        long auditLogCountAfter = auditLogRepository.findByAction("LOGIN_FAILURE").size();
        long newLoginFailureRows = auditLogCountAfter - auditLogCountBefore;
        System.out.println("TEST EVIDENCE 1 — LOGIN_FAILURE audit rows added: " + newLoginFailureRows);
        assertEquals(5, newLoginFailureRows,
                "5 LOGIN_FAILURE audit rows must be persisted (not rolled back)");
    }

    // ---- Task 2: Expired Lockout Handling ----

    @Test
    @DisplayName("B4.7-2a/c: Expired lock + WRONG password ends with failed_login_count=1, locked_until=null, response 401 without deadlock")
    public void testExpiredLockoutWithWrongPassword_resetsToOneAndNullLock() throws Exception {
        String testUser = "sarah.chen";

        // Setup: locked_until in past, failed_login_count = 5
        User user = userRepository.findByUsername(testUser).orElseThrow();
        user.setFailedLoginCount(5);
        user.setLockedUntil(OffsetDateTime.now().minusMinutes(5));
        userRepository.save(user);

        // Send 1 WRONG-password login attempt
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"" + testUser + "\",\"password\":\"WrongPassword!\"}")
                        .header("Origin", "http://localhost:3000"))
                .andExpect(status().isUnauthorized()); // must be 401 (not 423)

        // Verify DB: failed_login_count must be 1, locked_until must be null
        User updated = userRepository.findByUsername(testUser).orElseThrow();
        System.out.println("TEST EVIDENCE 2a — failed_login_count: " + updated.getFailedLoginCount());
        System.out.println("TEST EVIDENCE 2a — locked_until:       " + updated.getLockedUntil());
        assertEquals(1, updated.getFailedLoginCount(), "failed_login_count must be 1 after expired lock + wrong attempt");
        assertNull(updated.getLockedUntil(), "locked_until must be null (not relocked)");
    }

    @Test
    @DisplayName("B4.7-2b: Expired lock + CORRECT password succeeds, resets failed_login_count to 0 and locked_until=null")
    public void testExpiredLockoutWithCorrectPassword_resetsToZero() throws Exception {
        String testUser = "sarah.chen";

        // Setup: locked_until in past, failed_login_count = 5
        User user = userRepository.findByUsername(testUser).orElseThrow();
        user.setFailedLoginCount(5);
        user.setLockedUntil(OffsetDateTime.now().minusMinutes(5));
        userRepository.save(user);

        // Send 1 CORRECT-password login attempt
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"" + testUser + "\",\"password\":\"CloudGuard2026!\"}")
                        .header("Origin", "http://localhost:3000"))
                .andExpect(status().isOk())
                .andExpect(header().exists("Set-Cookie"));

        // Verify DB: failed_login_count must be 0, locked_until must be null
        User updated = userRepository.findByUsername(testUser).orElseThrow();
        System.out.println("TEST EVIDENCE 2b — failed_login_count: " + updated.getFailedLoginCount());
        System.out.println("TEST EVIDENCE 2b — locked_until:       " + updated.getLockedUntil());
        assertEquals(0, updated.getFailedLoginCount(), "failed_login_count must be 0 after successful login");
        assertNull(updated.getLockedUntil(), "locked_until must be null after successful login");
    }

    // ---- Task 3: Atomic Failure Increment & Concurrency ----

    @Test
    @DisplayName("B4.7-3: Concurrent wrong logins atomically increment failed_login_count without lost updates")
    public void testConcurrentWrongLoginsAtomicIncrement() throws Exception {
        String testUser = "sarah.chen";
        int concurrency = 20;
        ExecutorService executor = Executors.newFixedThreadPool(concurrency);
        CountDownLatch startLatch = new CountDownLatch(1);
        CountDownLatch doneLatch = new CountDownLatch(concurrency);

        for (int i = 0; i < concurrency; i++) {
            final int index = i;
            executor.submit(() -> {
                try {
                    startLatch.await();
                    mockMvc.perform(post("/api/auth/login")
                                    .contentType(MediaType.APPLICATION_JSON)
                                    .content("{\"username\":\"" + testUser + "\",\"password\":\"WrongPassword!\"}")
                                    .header("X-Forwarded-For", "172.16.0." + index)
                                    .header("Origin", "http://localhost:3000"));
                } catch (Exception e) {
                    // ignore error
                } finally {
                    doneLatch.countDown();
                }
            });
        }

        startLatch.countDown();
        boolean completed = doneLatch.await(15, TimeUnit.SECONDS);
        executor.shutdown();
        assertTrue(completed, "Concurrent requests must finish within 15s");

        User user = userRepository.findByUsername(testUser).orElseThrow();
        System.out.println("TEST EVIDENCE 3 — Concurrent final failed_login_count: " + user.getFailedLoginCount());
        System.out.println("TEST EVIDENCE 3 — Concurrent final locked_until:       " + user.getLockedUntil());
        // With atomic SQL increment (UPDATE ... failed_login_count = failed_login_count + 1),
        // all 20 failures are recorded without lost updates
        assertEquals(20, user.getFailedLoginCount(), "failed_login_count must be 20 (no lost updates in atomic increment)");
        assertNotNull(user.getLockedUntil(), "User must be locked after exceeding threshold");
    }

    // ---- Task 4: ipUserAttempts Bounding & TTL Eviction ----

    @Test
    @DisplayName("B4.6-2a: Successful login clears the in-memory rate-limit entry for that IP:user")
    public void testSuccessfulLoginClearsIpUserAttemptEntry() throws Exception {
        String testUser = "sarah.chen";

        // 3 failed attempts (below lockout threshold) to create an entry
        for (int i = 0; i < 3; i++) {
            mockMvc.perform(post("/api/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"username\":\"" + testUser + "\",\"password\":\"WrongPassword!\"}")
                            .header("X-Forwarded-For", "10.99.99.1")
                            .header("Origin", "http://localhost:3000"))
                    .andExpect(status().isUnauthorized());
        }

        int sizeBefore = authenticationService.getIpUserAttemptsSize();
        assertTrue(sizeBefore > 0, "Entry must exist after failed attempts");
        System.out.println("TEST EVIDENCE 4 — ipUserAttempts size before success: " + sizeBefore);

        // Successful login
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"" + testUser + "\",\"password\":\"CloudGuard2026!\"}")
                        .header("X-Forwarded-For", "10.99.99.1")
                        .header("Origin", "http://localhost:3000"))
                .andExpect(status().isOk());

        int sizeAfter = authenticationService.getIpUserAttemptsSize();
        System.out.println("TEST EVIDENCE 4 — ipUserAttempts size after success:  " + sizeAfter);
        assertEquals(0, sizeAfter,
                "In-memory entry must be removed after successful login");
    }

    @Test
    @DisplayName("B4.7-4a: ipUserAttempts TTL eviction removes stale entries")
    public void testIpUserAttemptsTtlEvictionRemovesStale() {
        authenticationService.resetLockoutState();

        // Stale entry: lastAttemptAt was 25 minutes ago (lockout duration is 15 minutes)
        authenticationService.recordStaleIpUserAttemptForTesting("192.0.2.1", "stale.user", 25);
        // Active entry: last attempt was 0 minutes ago (now)
        authenticationService.recordStaleIpUserAttemptForTesting("192.0.2.2", "active.user", 0);

        assertEquals(2, authenticationService.getIpUserAttemptsSize(), "Both entries must exist before eviction");

        // Run TTL eviction
        authenticationService.runEvictionForTesting();

        System.out.println("TEST EVIDENCE 4a — ipUserAttempts size after TTL eviction: "
                + authenticationService.getIpUserAttemptsSize());
        assertEquals(1, authenticationService.getIpUserAttemptsSize(),
                "Stale entry must be evicted; active entry must remain");
    }

    @Test
    @DisplayName("B4.7-4b: ipUserAttempts size never exceeds 10,000 after 10,500 distinct keys")
    public void testIpUserAttemptsSizeNeverExceedsMaxCapacity() {
        authenticationService.resetLockoutState();

        int totalKeys = 10_500;
        for (int i = 0; i < totalKeys; i++) {
            authenticationService.recordIpUserAttempt("10." + (i / 65536) + "." + ((i / 256) % 256) + "." + (i % 256), "user" + i);
        }

        int finalSize = authenticationService.getIpUserAttemptsSize();
        System.out.println("TEST EVIDENCE 4b — ipUserAttempts size after 10,500 keys: " + finalSize);
        assertTrue(finalSize <= 10_000, "Size must never exceed 10,000, was: " + finalSize);
        assertEquals(10_000, finalSize, "Size must be capped at exactly 10,000");
    }
}
