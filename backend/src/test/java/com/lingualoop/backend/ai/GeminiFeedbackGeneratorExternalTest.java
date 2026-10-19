package com.lingualoop.backend.ai;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Duration;
import java.util.List;

import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;

import com.lingualoop.backend.config.GeminiProperties;

/**
 * Gọi Gemini thật, tốn quota nên mặc định tắt. Chạy bằng:
 * {@code GEMINI_API_KEY=... ./mvnw test -Dtest=GeminiFeedbackGeneratorExternalTest} (đặt thêm
 * {@code GEMINI_TEXT_MODEL} nếu muốn thử model khác).
 */
@Tag("external")
@EnabledIfEnvironmentVariable(named = "GEMINI_API_KEY", matches = ".+")
class GeminiFeedbackGeneratorExternalTest {

    @Test
    void realGemini_writesAShortVietnameseFeedback() {
        var properties = new GeminiProperties(System.getenv("GEMINI_API_KEY"), System.getenv("GEMINI_TEXT_MODEL"),
                System.getenv("GEMINI_FALLBACK_MODEL"), Duration.ofSeconds(30));
        var generator = new GeminiFeedbackGenerator(properties);

        GeneratedFeedback feedback = generator.generate(new FeedbackRequest("Think about it", 72, 70.0, 80.0, 100.0,
                null, List.of(new FeedbackRequest.Word("think", 45, "mispronounced",
                        List.of(new FeedbackRequest.Phoneme("θ", 30))))));

        assertThat(feedback.content()).isNotBlank();
        assertThat(feedback.promptVersion()).isEqualTo(FeedbackPromptBuilder.VERSION);
        assertThat(feedback.model()).isNotBlank();
        System.out.println("Nhận xét AI (" + feedback.model() + "): " + feedback.content());
    }
}
