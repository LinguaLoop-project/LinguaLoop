package com.lingualoop.backend.tutor;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Duration;

import org.junit.jupiter.api.Test;

import com.lingualoop.backend.config.GeminiLiveProperties;
import com.lingualoop.backend.config.GeminiProperties;

class GeminiLiveTokenIssuerTest {

    @Test
    void theGeminiHttpTimeoutFollowsTheConfiguredValueAndKeepsTheV1alphaVersion() {
        GeminiProperties props = new GeminiProperties("key", "text-model", null, Duration.ofSeconds(7));

        var options = GeminiLiveTokenIssuer.httpOptions(props);

        assertThat(options.timeout()).contains(7_000);
        assertThat(options.apiVersion()).contains("v1alpha");
    }

    @Test
    void speechRecognitionIsHintedToEnglishAndVietnameseSoItDoesNotGuessOtherLanguages() {
        var issuer = new GeminiLiveTokenIssuer(new GeminiProperties("key", "text-model", null, Duration.ofSeconds(7)),
                new GeminiLiveProperties("live-model", ""), java.time.Clock.systemUTC());

        var config = issuer.liveConfig(new LiveTokenIssuer.LiveSpec("prompt", GeminiLiveTokenIssuer.tools(), Duration.ofMinutes(1), false));

        var hints = config.inputAudioTranscription().orElseThrow().languageHints().orElseThrow();
        assertThat(hints.languageCodes().orElseThrow()).containsExactly("en-US", "vi-VN");
    }
}
