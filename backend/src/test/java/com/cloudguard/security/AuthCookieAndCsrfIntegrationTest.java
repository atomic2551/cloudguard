package com.cloudguard.security;

import com.cloudguard.AbstractIntegrationTest;
import com.cloudguard.auth.service.AuthenticationService;
import com.cloudguard.security.config.CookieSecurityValidator;
import com.cloudguard.security.jwt.JwtAuthenticationFilter;
import com.cloudguard.security.config.SecurityConfig;
import com.cloudguard.user.entity.User;
import com.cloudguard.user.repository.UserRepository;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.mock.env.MockEnvironment;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.time.OffsetDateTime;
import java.util.List;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@AutoConfigureMockMvc
public class AuthCookieAndCsrfIntegrationTest extends AbstractIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private AuthenticationService authenticationService;

    @Autowired
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @Autowired
    private UserRepository userRepository;

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

    @Test
    @DisplayName("Login sets HttpOnly, SameSite=Strict cookie and omits token from JSON body")
    public void testLoginSetsHttpOnlyStrictCookie_andNoTokenInBody() throws Exception {
        MvcResult result = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"sarah.chen\",\"password\":\"CloudGuard2026!\"}")
                        .header("Origin", "http://localhost:3000"))
                .andExpect(status().isOk())
                .andExpect(header().exists("Set-Cookie"))
                .andExpect(jsonPath("$.data.user.username", is("sarah.chen")))
                .andExpect(jsonPath("$.data.token").doesNotExist())
                .andExpect(jsonPath("$.token").doesNotExist())
                .andReturn();

        List<String> setCookies = result.getResponse().getHeaders("Set-Cookie");
        assertFalse(setCookies.isEmpty());
        String cgCookieHeader = setCookies.stream()
                .filter(c -> c.startsWith("cg_token="))
                .findFirst()
                .orElse(null);
        assertNotNull(cgCookieHeader, "Must have a Set-Cookie header starting with cg_token=");
        assertTrue(cgCookieHeader.contains("HttpOnly"), "Cookie must be HttpOnly");
        assertTrue(cgCookieHeader.contains("SameSite=Strict"), "Cookie must have SameSite=Strict");
        assertTrue(cgCookieHeader.contains("Path=/"), "Cookie path must be /");
        System.out.println("TEST EVIDENCE - Set-Cookie header: " + cgCookieHeader.replaceAll("cg_token=[^;]+", "cg_token=[REDACTED]"));
    }

    @Test
    @DisplayName("6(a) GET /api/alerts without cookie returns 401 Unauthorized")
    public void testGetAlertsWithoutCookieReturns401() throws Exception {
        mockMvc.perform(get("/api/alerts"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Request with valid cg_token cookie successfully authenticates")
    public void testRequestWithCookieWorks() throws Exception {
        MvcResult loginResult = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"sarah.chen\",\"password\":\"CloudGuard2026!\"}")
                        .header("Origin", "http://localhost:3000"))
                .andExpect(status().isOk())
                .andReturn();

        Cookie authCookie = loginResult.getResponse().getCookie("cg_token");
        assertNotNull(authCookie, "cg_token cookie must be present");

        mockMvc.perform(get("/api/alerts")
                        .cookie(authCookie))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items").isArray());
    }

    @Test
    @DisplayName("6(b) Authorization Bearer token with header-fallback=false returns 401, with true returns 200")
    public void testAuthorizationHeaderFallbackBehavior() throws Exception {
        MvcResult loginResult = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"sarah.chen\",\"password\":\"CloudGuard2026!\"}")
                        .header("Origin", "http://localhost:3000"))
                .andExpect(status().isOk())
                .andReturn();

        Cookie authCookie = loginResult.getResponse().getCookie("cg_token");
        assertNotNull(authCookie);
        String token = authCookie.getValue();

        try {
            // header-fallback=false -> 401
            jwtAuthenticationFilter.setHeaderFallback(false);
            mockMvc.perform(get("/api/alerts")
                            .header("Authorization", "Bearer " + token))
                    .andExpect(status().isUnauthorized());

            // header-fallback=true -> 200
            jwtAuthenticationFilter.setHeaderFallback(true);
            mockMvc.perform(get("/api/alerts")
                            .header("Authorization", "Bearer " + token))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.items").isArray());
        } finally {
            jwtAuthenticationFilter.setHeaderFallback(false);
        }
    }

    @Test
    @DisplayName("6(c) Authenticated mutating request with untrusted Origin returns 403 Forbidden")
    public void testAuthenticatedMutatingRequestWithUntrustedOriginReturns403() throws Exception {
        MvcResult loginResult = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"sarah.chen\",\"password\":\"CloudGuard2026!\"}")
                        .header("Origin", "http://localhost:3000"))
                .andExpect(status().isOk())
                .andReturn();

        Cookie authCookie = loginResult.getResponse().getCookie("cg_token");
        assertNotNull(authCookie);

        MvcResult csrfResult = mockMvc.perform(get("/api/auth/csrf").cookie(authCookie))
                .andExpect(status().isOk())
                .andReturn();

        Cookie xsrfCookie = csrfResult.getResponse().getCookie("XSRF-TOKEN");
        assertNotNull(xsrfCookie);

        mockMvc.perform(post("/api/auth/logout")
                        .cookie(authCookie, xsrfCookie)
                        .header("X-XSRF-TOKEN", xsrfCookie.getValue())
                        .header("Origin", "http://malicious-attacker.com"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("6(d) Cookie-authenticated POST with no Origin/Referer and valid XSRF token returns 403")
    public void testCookieAuthenticatedPostWithoutOriginOrRefererReturns403() throws Exception {
        MvcResult loginResult = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"sarah.chen\",\"password\":\"CloudGuard2026!\"}")
                        .header("Origin", "http://localhost:3000"))
                .andExpect(status().isOk())
                .andReturn();

        Cookie authCookie = loginResult.getResponse().getCookie("cg_token");
        assertNotNull(authCookie);

        MvcResult csrfResult = mockMvc.perform(get("/api/auth/csrf").cookie(authCookie))
                .andExpect(status().isOk())
                .andReturn();

        Cookie xsrfCookie = csrfResult.getResponse().getCookie("XSRF-TOKEN");
        assertNotNull(xsrfCookie);

        // Mutating request with auth cookie + XSRF token but NO Origin and NO Referer -> must be 403
        mockMvc.perform(post("/api/auth/logout")
                        .cookie(authCookie, xsrfCookie)
                        .header("X-XSRF-TOKEN", xsrfCookie.getValue()))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Mutating request without X-XSRF-TOKEN returns 403 Forbidden")
    public void testMutatingRequestWithoutXsrfTokenReturns403() throws Exception {
        MvcResult loginResult = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"sarah.chen\",\"password\":\"CloudGuard2026!\"}")
                        .header("Origin", "http://localhost:3000"))
                .andExpect(status().isOk())
                .andReturn();

        Cookie authCookie = loginResult.getResponse().getCookie("cg_token");
        assertNotNull(authCookie);

        mockMvc.perform(post("/api/auth/logout")
                        .cookie(authCookie)
                        .header("Origin", "http://localhost:3000"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Mutating request with valid XSRF-TOKEN and cookie succeeds and sets SameSite=Strict on XSRF-TOKEN")
    public void testMutatingRequestWithXsrfTokenSucceeds() throws Exception {
        MvcResult loginResult = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"sarah.chen\",\"password\":\"CloudGuard2026!\"}")
                        .header("Origin", "http://localhost:3000"))
                .andExpect(status().isOk())
                .andReturn();

        Cookie authCookie = loginResult.getResponse().getCookie("cg_token");
        assertNotNull(authCookie);

        MvcResult csrfResult = mockMvc.perform(get("/api/auth/csrf")
                        .cookie(authCookie))
                .andExpect(status().isOk())
                .andReturn();

        Cookie xsrfCookie = csrfResult.getResponse().getCookie("XSRF-TOKEN");
        assertNotNull(xsrfCookie, "XSRF-TOKEN cookie must be set by csrf bootstrap");

        List<String> setCookies = csrfResult.getResponse().getHeaders("Set-Cookie");
        String xsrfHeader = setCookies.stream().filter(c -> c.startsWith("XSRF-TOKEN=") && c.contains("SameSite=Strict")).findFirst().orElse("");
        assertTrue(xsrfHeader.contains("SameSite=Strict"), "XSRF-TOKEN cookie must have SameSite=Strict");
        System.out.println("TEST EVIDENCE - XSRF-TOKEN Set-Cookie: " + xsrfHeader.replaceAll("XSRF-TOKEN=[^;]+", "XSRF-TOKEN=[REDACTED]"));

        mockMvc.perform(post("/api/auth/logout")
                        .cookie(authCookie, xsrfCookie)
                        .header("Origin", "http://localhost:3000")
                        .header("X-XSRF-TOKEN", xsrfCookie.getValue()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)));
    }

    @Test
    @DisplayName("Item 2: Same username from two different client IPs is tracked separately")
    public void testSameUserDifferentIpsTrackedSeparately() throws Exception {
        String testUser = "sarah.chen";

        // IP 1 (198.51.100.1): 5 failed attempts trigger lockout
        for (int i = 0; i < 5; i++) {
            mockMvc.perform(post("/api/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"username\":\"" + testUser + "\",\"password\":\"WrongPassword!\"}")
                            .header("X-Forwarded-For", "198.51.100.1")
                            .header("Origin", "http://localhost:3000"))
                    .andExpect(status().isUnauthorized());
        }

        // 6th attempt from IP 1 is locked out (423)
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"" + testUser + "\",\"password\":\"WrongPassword!\"}")
                        .header("X-Forwarded-For", "198.51.100.1")
                        .header("Origin", "http://localhost:3000"))
                .andExpect(status().isLocked())
                .andExpect(jsonPath("$.error", is("ACCOUNT_LOCKED")));

        // Clear DB-level lockout so we can isolate and verify that the in-memory
        // limiter tracks IP 1 and IP 2 separately (IP 1 remains locked in memory).
        userRepository.findByUsername(testUser).ifPresent(u -> {
            u.setLockedUntil(null);
            userRepository.save(u);
        });

        // Attempt from IP 2 (198.51.100.2) with correct credentials must succeed (200 OK)
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"" + testUser + "\",\"password\":\"CloudGuard2026!\"}")
                        .header("X-Forwarded-For", "198.51.100.2")
                        .header("Origin", "http://localhost:3000"))
                .andExpect(status().isOk())
                .andExpect(header().exists("Set-Cookie"));
    }

    @Test
    @DisplayName("Item 1 Unit/Integration: Test all four CookieSecurityValidator cases")
    public void testCookieSecurityValidatorAllFourCases() {
        // Case 1: empty profile + false -> fails
        MockEnvironment emptyEnv = new MockEnvironment();
        CookieSecurityValidator val1 = new CookieSecurityValidator(emptyEnv, false);
        IllegalStateException ex1 = assertThrows(IllegalStateException.class, val1::validate);
        assertTrue(ex1.getMessage().contains("cloudguard.cookie.secure must be true in non-local profiles"));
        System.out.println("TEST EVIDENCE - Case 1 (empty + false): " + ex1.getMessage());

        // Case 2: production + false -> fails
        MockEnvironment prodEnv = new MockEnvironment();
        prodEnv.setActiveProfiles("production");
        CookieSecurityValidator val2 = new CookieSecurityValidator(prodEnv, false);
        IllegalStateException ex2 = assertThrows(IllegalStateException.class, val2::validate);
        assertTrue(ex2.getMessage().contains("cloudguard.cookie.secure must be true in non-local profiles"));
        System.out.println("TEST EVIDENCE - Case 2 (production + false): " + ex2.getMessage());

        // Case 3: local + false -> starts (no exception)
        MockEnvironment localEnv = new MockEnvironment();
        localEnv.setActiveProfiles("local");
        CookieSecurityValidator val3 = new CookieSecurityValidator(localEnv, false);
        assertDoesNotThrow(val3::validate);
        System.out.println("TEST EVIDENCE - Case 3 (local + false): Started successfully");

        // Case 4: empty profile + default true -> starts (no exception)
        MockEnvironment defaultEnv = new MockEnvironment();
        CookieSecurityValidator val4 = new CookieSecurityValidator(defaultEnv, true);
        assertDoesNotThrow(val4::validate);
        System.out.println("TEST EVIDENCE - Case 4 (empty + default true): Started successfully");
    }

    @Test
    @DisplayName("Item 3: Spoofed X-Forwarded-For prefix does not let client bypass lockout")
    public void testSpoofedForwardedForPrefixDoesNotBypassLockout() throws Exception {
        String testUser = "sarah.chen";

        // Send 5 failed attempts with spoofed prefix 10.0.0.1, real client 198.51.100.5
        for (int i = 0; i < 5; i++) {
            mockMvc.perform(post("/api/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"username\":\"" + testUser + "\",\"password\":\"WrongPassword!\"}")
                            .header("X-Forwarded-For", "10.0.0.1, 198.51.100.5")
                            .header("Origin", "http://localhost:3000"))
                    .andExpect(status().isUnauthorized());
        }

        // 6th attempt changes spoofed prefix to 10.0.0.99 but real client is still 198.51.100.5
        // Since resolveClientIp selects the rightmost non-trusted IP, it must remain locked out (423)
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"" + testUser + "\",\"password\":\"WrongPassword!\"}")
                        .header("X-Forwarded-For", "10.0.0.99, 198.51.100.5")
                        .header("Origin", "http://localhost:3000"))
                .andExpect(status().isLocked())
                .andExpect(jsonPath("$.error", is("ACCOUNT_LOCKED")));
    }

    @Test
    @DisplayName("Item 3: Per-username lockout in database is temporary and auto-expires")
    public void testDatabaseUserLockoutAutoExpires() throws Exception {
        String testUser = "sarah.chen";
        User user = userRepository.findByUsername(testUser).orElseThrow();

        // 1. Manually set lockedUntil into future
        user.setLockedUntil(OffsetDateTime.now().plusMinutes(15));
        user.setFailedLoginCount(5);
        userRepository.save(user);

        // Login is rejected with 423 Locked
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"" + testUser + "\",\"password\":\"CloudGuard2026!\"}")
                        .header("Origin", "http://localhost:3000"))
                .andExpect(status().isLocked())
                .andExpect(jsonPath("$.error", is("ACCOUNT_LOCKED")));

        // 2. Set lockedUntil into the past (expired lockout)
        user = userRepository.findByUsername(testUser).orElseThrow();
        user.setLockedUntil(OffsetDateTime.now().minusSeconds(10));
        userRepository.save(user);

        // Login must auto-unlock and succeed (200 OK)
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"" + testUser + "\",\"password\":\"CloudGuard2026!\"}")
                        .header("Origin", "http://localhost:3000"))
                .andExpect(status().isOk())
                .andExpect(header().exists("Set-Cookie"));

        // Verify DB record was auto-cleared
        User unlockedUser = userRepository.findByUsername(testUser).orElseThrow();
        assertNull(unlockedUser.getLockedUntil(), "lockedUntil must be null after expiration");
        assertEquals(0, unlockedUser.getFailedLoginCount(), "failedLoginCount must be 0 after auto-unlock");
    }

    @Test
    @DisplayName("Non-local profile with blank allowed-origins fails startup")
    public void testNonLocalProfileBlankAllowedOriginsFailsStartup() {
        MockEnvironment prodEnv = new MockEnvironment();
        prodEnv.setActiveProfiles("production");
        SecurityConfig config = new SecurityConfig(jwtAuthenticationFilter, prodEnv);
        IllegalStateException ex = assertThrows(IllegalStateException.class, config::validateSecurityConfig);
        assertTrue(ex.getMessage().contains("cloudguard.allowed-origins must be explicitly configured in non-local profiles"));
        System.out.println("TEST EVIDENCE - Case non-local blank allowed-origins: " + ex.getMessage());
    }
}
