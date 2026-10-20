package com.lingualoop.backend.tutor;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Duration;

import org.junit.jupiter.api.Test;

import com.lingualoop.backend.config.GeminiProperties;

class GeminiLiveTokenIssuerTest {

    @Test
    void theGeminiHttpTimeoutFollowsTheConfiguredValueAndKeepsTheV1alphaVersion() {
        GeminiProperties props = new GeminiProperties("key", "text-model", null, Duration.ofSeconds(7));

        var options = GeminiLiveTokenIssuer.httpOptions(props);

        assertThat(options.timeout()).contains(7_000);
        assertThat(options.apiVersion()).contains("v1alpha");
    }
}
