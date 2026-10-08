package com.lingualoop.backend.config;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Duration;
import java.util.Map;

import org.junit.jupiter.api.Test;
import org.springframework.boot.context.properties.bind.Binder;
import org.springframework.boot.context.properties.source.MapConfigurationPropertySource;

class GooglePropertiesTest {

    @Test
    void bind_nothingSet_usesDefaultsAndIsNotConfigured() {
        GoogleProperties props = new Binder(new MapConfigurationPropertySource(Map.of("app.google.timeout", "5s")))
                .bind("app.google", GoogleProperties.class).get();

        assertThat(props.clientId()).isEmpty();
        assertThat(props.configured()).isFalse();
        assertThat(props.jwkSetUri()).isEqualTo("https://www.googleapis.com/oauth2/v3/certs");
        assertThat(props.timeout()).isEqualTo(Duration.ofSeconds(5));
    }

    @Test
    void bind_clientIdSet_isConfigured() {
        GoogleProperties props = new Binder(new MapConfigurationPropertySource(
                Map.of("app.google.client-id", "abc.apps.googleusercontent.com")))
                .bind("app.google", GoogleProperties.class).get();

        assertThat(props.configured()).isTrue();
        assertThat(props.timeout()).isEqualTo(Duration.ofSeconds(5));
    }
}
