package com.lingualoop.backend.dictionary.util;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

import com.lingualoop.backend.config.AudioProperties;

class AudioUrlResolverTest {

    @Test
    void resolve_returnsNullForNullPath() {
        assertThat(new AudioUrlResolver(new AudioProperties("https://cdn.example.com/dictionary/")).resolve(null))
                .isNull();
    }

    @Test
    void resolve_returnsPathUnchangedWhenBaseUrlNotConfigured() {
        assertThat(new AudioUrlResolver(new AudioProperties("")).resolve("audio/hello-us.mp3"))
                .isEqualTo("audio/hello-us.mp3");
        assertThat(new AudioUrlResolver(new AudioProperties(null)).resolve("audio/hello-us.mp3"))
                .isEqualTo("audio/hello-us.mp3");
    }

    @Test
    void resolve_joinsBaseUrlAndPathWithExactlyOneSlash() {
        assertThat(new AudioUrlResolver(new AudioProperties("https://cdn.example.com/dictionary"))
                .resolve("audio/hello-us.mp3"))
                .isEqualTo("https://cdn.example.com/dictionary/audio/hello-us.mp3");
        assertThat(new AudioUrlResolver(new AudioProperties("https://cdn.example.com/dictionary/"))
                .resolve("audio/hello-us.mp3"))
                .isEqualTo("https://cdn.example.com/dictionary/audio/hello-us.mp3");
        assertThat(new AudioUrlResolver(new AudioProperties("https://cdn.example.com/dictionary/"))
                .resolve("/audio/hello-us.mp3"))
                .isEqualTo("https://cdn.example.com/dictionary/audio/hello-us.mp3");
    }
}
