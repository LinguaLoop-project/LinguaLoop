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
                        List.of(new FeedbackRequest.Phoneme("θ", null, 30))))));

        assertThat(feedback.content()).isNotBlank();
        assertThat(feedback.promptVersion()).isEqualTo(FeedbackPromptBuilder.VERSION);
        assertThat(feedback.model()).isNotBlank();
        System.out.println("Nhận xét AI (" + feedback.model() + "): " + feedback.content());
    }

    /** Câu dài, nhiều lỗi, có từ bị bỏ sót và lượt trước: nhận xét phải gom, ưu tiên tối đa 3 lỗi và gắn mẹo của hệ thống. */
    @Test
    void realGemini_groupsAndPrioritizesAManyErrorSentence() {
        var properties = new GeminiProperties(System.getenv("GEMINI_API_KEY"), System.getenv("GEMINI_TEXT_MODEL"),
                System.getenv("GEMINI_FALLBACK_MODEL"), Duration.ofSeconds(60));
        var generator = new GeminiFeedbackGenerator(properties);
        var words = List.of(
                word("I", 90, "correct"), word("watch", 43, "mispronounced", ph("w", null, 40), ph("tʃ", null, 45)),
                word("videos", 50, "mispronounced", ph("v", null, 45)), word("on", 88, "correct"),
                word("my", 85, "correct"), word("phone", 53, "mispronounced", ph("f", "oʊ", 40)),
                word("for", 0, "omitted"), word("an", 60, "mispronounced"), word("hour", 0, "omitted"),
                word("without", 43, "mispronounced", ph("d", "ð", 35)), word("the", 70, "mispronounced", ph("d", "ð", 40)),
                word("sound", 90, "correct"));
        var tips = java.util.Map.of("w", "Hai môi chụm tròn rồi mở ra.", "ð", "Đặt đầu lưỡi giữa hai hàm răng, thổi nhẹ và rung dây thanh.",
                "v", "Răng trên chạm môi dưới và rung dây thanh.", "tʃ", "Đầu lưỡi chạm lợi trên rồi bật hơi.", "f", "Răng trên chạm môi dưới, thổi hơi.");
        var request = new FeedbackRequest("I watch videos on my phone for an hour without the sound", 46, 50.0, 72.0, 88.0,
                null, words, new FeedbackRequest.Previous(52, java.util.Map.of("watch", 40.0, "videos", 55.0)), tips);

        GeneratedFeedback feedback = generator.generate(request);

        assertThat(feedback.content()).startsWith("{");
        System.out.println("Nhận xét có cấu trúc (" + feedback.model() + "): " + feedback.content());
    }

    private static FeedbackRequest.Word word(String text, double accuracy, String outcome, FeedbackRequest.Phoneme... weak) {
        return new FeedbackRequest.Word(text, accuracy, outcome, List.of(weak));
    }

    private static FeedbackRequest.Phoneme ph(String symbol, String expected, double accuracy) {
        return new FeedbackRequest.Phoneme(symbol, expected, accuracy);
    }
}
