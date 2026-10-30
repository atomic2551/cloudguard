package com.cloudguard.security.jwt;

import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;

public class JwtSecretValidationTest {

    @Test
    public void testSecretFailsIfShorterThan48Chars() {
        JwtTokenProvider provider = new JwtTokenProvider();
        ReflectionTestUtils.setField(provider, "jwtSecret", "too-short-secret-key-less-than-48-chars");
        
        assertThrows(IllegalArgumentException.class, provider::validateSecret);
    }

    @Test
    public void testSecretFailsIfNullOrEmpty() {
        JwtTokenProvider provider = new JwtTokenProvider();
        ReflectionTestUtils.setField(provider, "jwtSecret", "");
        assertThrows(IllegalArgumentException.class, provider::validateSecret);

        ReflectionTestUtils.setField(provider, "jwtSecret", null);
        assertThrows(IllegalArgumentException.class, provider::validateSecret);
    }

    @Test
    public void testSecretSucceedsWhen48CharsOrMore() {
        JwtTokenProvider provider = new JwtTokenProvider();
        // 64-character valid Base64 string
        ReflectionTestUtils.setField(provider, "jwtSecret", "zQ3j7K2wH5bR+X/uV4m9nP1hG8sF0yL6cT3aE7vM9qJ2w7x8y9z0A1B2C3D4E5F6");
        assertDoesNotThrow(provider::validateSecret);
    }
}
