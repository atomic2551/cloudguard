package com.cloudguard.security.config;

import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.List;

@Component
public class CookieSecurityValidator {

    private static final Logger logger = LoggerFactory.getLogger(CookieSecurityValidator.class);

    private final Environment environment;
    private final boolean cookieSecure;

    public CookieSecurityValidator(
            Environment environment,
            @Value("${cloudguard.cookie.secure:true}") boolean cookieSecure) {
        this.environment = environment;
        this.cookieSecure = cookieSecure;
    }

    @PostConstruct
    public void validate() {
        List<String> activeProfiles = Arrays.asList(environment.getActiveProfiles());
        boolean isLocalOrTest = activeProfiles.contains("local") || activeProfiles.contains("test");

        if (!isLocalOrTest && !cookieSecure) {
            String errorMsg = "CRITICAL SECURITY CONFIGURATION ERROR: cloudguard.cookie.secure must be true in non-local profiles! Active profiles: " + activeProfiles;
            logger.error(errorMsg);
            throw new IllegalStateException(errorMsg);
        }
        logger.info("Cookie security validated: secure={}, activeProfiles={}", cookieSecure, activeProfiles);
    }
}
