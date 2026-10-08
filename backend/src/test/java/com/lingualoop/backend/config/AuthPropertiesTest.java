package com.lingualoop.backend.config;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Clock;
import java.time.Duration;
import java.util.Map;

import org.junit.jupiter.api.Test;
import org.springframework.boot.context.properties.bind.Binder;
import org.springframework.boot.context.properties.source.MapConfigurationPropertySource;

class AuthPropertiesTest {

    @Test
    void bind_onlyFrontendUrl_usesDocumentedDefaults() {
        AuthProperties props = new Binder(new MapConfigurationPropertySource(
                Map.of("app.auth.frontend-url", "http://localhost:5173")))
                .bind("app.auth", AuthProperties.class).get();

        assertThat(props.frontendUrl()).isEqualTo("http://localhost:5173");
        assertThat(props.mailFrom()).isEqualTo("no-reply@lingualoop.local");
        assertThat(props.maxFailedAttempts()).isEqualTo(5);
        assertThat(props.lockDuration()).isEqualTo(Duration.ofMinutes(15));
        assertThat(props.verifyTtl()).isEqualTo(Duration.ofHours(24));
        assertThat(props.resendCooldown()).isEqualTo(Duration.ofSeconds(60));
        assertThat(props.refreshTokenTtl()).isEqualTo(Duration.ofDays(30));
        assertThat(props.refreshReuseGrace()).isEqualTo(Duration.ofSeconds(10));
        assertThat(props.cookie().sameSite()).isEqualTo("Lax");
        assertThat(props.cookie().secure()).isFalse();
    }

    @Test
    void clockConfig_providesUtcSystemClock() {
        Clock clock = new ClockConfig().clock();

        assertThat(clock.getZone().getId()).isEqualTo("Z");
    }
}
