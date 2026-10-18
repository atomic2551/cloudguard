package com.cloudguard.security;

import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import static org.junit.jupiter.api.Assertions.assertTrue;

class PasswordEncodingTest {

    @Test
    void testBcryptEncoding() {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        String rawPassword = "CloudGuard2026!";
        String encodedPassword = encoder.encode(rawPassword);
        System.out.println("GENERATED BCRYPT HASH: " + encodedPassword);
        assertTrue(encoder.matches(rawPassword, encodedPassword));
    }
}
