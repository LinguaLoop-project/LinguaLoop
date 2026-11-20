package com.lingualoop.backend.config;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.Test;

class LessonImportPropertiesTest {

    private static LessonImportProperties withThinkingLevel(String level) {
        return new LessonImportProperties(null, null, null, null, null, null, null, level, null, null);
    }

    @Test
    void thinking_level_defaults_to_low() {
        assertThat(withThinkingLevel(null).thinkingLevel()).isEqualTo("LOW");
    }

    @Test
    void thinking_level_is_normalized_to_upper_case() {
        assertThat(withThinkingLevel(" medium ").thinkingLevel()).isEqualTo("MEDIUM");
    }

    @Test
    void blank_thinking_level_lets_the_model_decide() {
        assertThat(withThinkingLevel("").thinkingLevel()).isNull();
    }

    @Test
    void unknown_thinking_level_fails_at_startup() {
        assertThatThrownBy(() -> withThinkingLevel("0")).isInstanceOf(IllegalArgumentException.class);
    }
}
