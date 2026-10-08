package com.lingualoop.backend.config;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Map;

import org.junit.jupiter.api.Test;
import org.springframework.boot.context.properties.bind.Binder;
import org.springframework.boot.context.properties.source.MapConfigurationPropertySource;

class GooglePropertiesTest {

    private static GoogleProperties bind(Map<String, String> source) {
        return new Binder(new MapConfigurationPropertySource(source))
                .bindOrCreate("app.google", GoogleProperties.class);
    }

    @Test
    void bind_nothingSet_usesDefaultsAndIsNotConfigured() {
        GoogleProperties props = bind(Map.of());

        assertThat(props.clientId()).isEmpty();
        assertThat(props.clientSecret()).isEmpty();
        assertThat(props.configured()).isFalse();
        assertThat(props.redirectUri()).isEqualTo("http://localhost:5173/authenticate");
        assertThat(props.oauthUrl()).isEqualTo("https://oauth2.googleapis.com");
        assertThat(props.userInfoUrl()).isEqualTo("https://openidconnect.googleapis.com");
    }

    @Test
    void bind_onlyClientId_isStillNotConfigured() {
        GoogleProperties props = bind(Map.of("app.google.client-id", "abc.apps.googleusercontent.com"));

        assertThat(props.configured()).isFalse();
    }

    @Test
    void bind_clientIdAndSecret_isConfigured() {
        GoogleProperties props = bind(Map.of(
                "app.google.client-id", "abc.apps.googleusercontent.com",
                "app.google.client-secret", "not-a-real-secret"));

        assertThat(props.configured()).isTrue();
    }
}
