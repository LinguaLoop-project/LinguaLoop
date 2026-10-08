package com.lingualoop.backend.auth.service;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class SecureTokensTest {

    @Test
    void generate_returnsUrlSafeTokenOf32Bytes_andNeverRepeats() {
        String a = SecureTokens.generate();
        String b = SecureTokens.generate();

        assertThat(a).hasSize(43).matches("[A-Za-z0-9_-]+");
        assertThat(a).isNotEqualTo(b);
    }

    @Test
    void sha256_isDeterministicLowerHexAndDiffersFromInput() {
        assertThat(SecureTokens.sha256("abc"))
                .isEqualTo("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
        assertThat(SecureTokens.sha256("abc")).isEqualTo(SecureTokens.sha256("abc"));
    }
}
