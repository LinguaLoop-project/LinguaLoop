package com.lingualoop.backend.ai;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.io.UncheckedIOException;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;

import org.junit.jupiter.api.Test;

import com.google.genai.errors.ClientException;
import com.google.genai.errors.ServerException;
import com.lingualoop.backend.common.exception.BusinessException;
import com.lingualoop.backend.common.exception.ErrorCode;
import com.lingualoop.backend.config.GeminiProperties;

/** Tự thử lại một lần khi Gemini quá tải (503/429), dùng model dự phòng, và đổi lỗi thành lỗi nghiệp vụ rõ ràng. */
class GeminiFeedbackGeneratorTest {

    private static final FeedbackRequest REQUEST = new FeedbackRequest("Hi", 90, null, null, null, null, List.of());

    private static GeminiProperties properties(String fallback) {
        return new GeminiProperties("key", "main-model", fallback, Duration.ofSeconds(20));
    }

    private static GeneratedFeedback ok(String model) {
        return new GeneratedFeedback("tốt", model, "v1", 1, 1);
    }

    private static ServerException overloaded() {
        return new ServerException(503, "UNAVAILABLE", "This model is currently experiencing high demand");
    }

    private final List<String> usedModels = new ArrayList<>();

    private GeminiFeedbackGenerator generator(String fallback, GeminiFeedbackGenerator.Attempt attempt) {
        return new GeminiFeedbackGenerator(properties(fallback), (model, request, onText) -> {
            usedModels.add(model);
            return attempt.run(model, request, onText);
        }, 0);
    }

    @Test
    void overloaded_thenRetriesOnceWithTheFallbackModel() {
        int[] calls = {0};
        var generator = generator("fallback-model", (model, request, onText) -> {
            if (calls[0]++ == 0) {
                throw overloaded();
            }
            return ok(model);
        });

        GeneratedFeedback result = generator.generate(REQUEST);

        assertThat(result.model()).isEqualTo("fallback-model");
        assertThat(usedModels).containsExactly("main-model", "fallback-model");
    }

    @Test
    void overloaded_withoutFallback_retriesWithTheMainModel() {
        int[] calls = {0};
        var generator = generator("", (model, request, onText) -> {
            if (calls[0]++ == 0) {
                throw new ClientException(429, "RESOURCE_EXHAUSTED", "quota");
            }
            return ok(model);
        });

        assertThat(generator.generate(REQUEST).model()).isEqualTo("main-model");
        assertThat(usedModels).containsExactly("main-model", "main-model");
    }

    @Test
    void overloadedTwice_reportsBusyAfterExactlyTwoAttempts() {
        var generator = generator("fallback-model", (model, request, onText) -> {
            throw overloaded();
        });

        assertThatThrownBy(() -> generator.generate(REQUEST))
                .isInstanceOfSatisfying(BusinessException.class,
                        e -> assertThat(e.getErrorCode()).isEqualTo(ErrorCode.AI_FEEDBACK_BUSY));
        assertThat(usedModels).hasSize(2);
    }

    @Test
    void overloadedAfterSomeTextWasSent_isNotRetriedBecauseTheTextWouldRepeat() {
        var generator = generator("fallback-model", (model, request, onText) -> {
            onText.accept("Bạn đọc ");
            throw overloaded();
        });
        List<String> sent = new ArrayList<>();

        assertThatThrownBy(() -> generator.generate(REQUEST, sent::add))
                .isInstanceOfSatisfying(BusinessException.class,
                        e -> assertThat(e.getErrorCode()).isEqualTo(ErrorCode.AI_FEEDBACK_BUSY));
        assertThat(usedModels).hasSize(1);
        assertThat(sent).containsExactly("Bạn đọc ");
    }

    @Test
    void otherErrors_areNotRetriedAndBecomeUnavailable() {
        var generator = generator("fallback-model", (model, request, onText) -> {
            throw new IllegalStateException("không phải lỗi quá tải");
        });

        assertThatThrownBy(() -> generator.generate(REQUEST))
                .isInstanceOfSatisfying(BusinessException.class,
                        e -> assertThat(e.getErrorCode()).isEqualTo(ErrorCode.AI_FEEDBACK_UNAVAILABLE));
        assertThat(usedModels).hasSize(1);
    }

    @Test
    void learnerClosingThePage_isRethrownAsIsAndNotRetried() {
        var generator = generator("fallback-model", (model, request, onText) -> {
            throw new UncheckedIOException(new java.io.IOException("client closed"));
        });

        assertThatThrownBy(() -> generator.generate(REQUEST)).isInstanceOf(UncheckedIOException.class);
        assertThat(usedModels).hasSize(1);
    }

    @Test
    void withoutApiKey_isUnavailableWithoutCallingGemini() {
        var generator = new GeminiFeedbackGenerator(new GeminiProperties("", "m", "", Duration.ofSeconds(1)),
                (model, request, onText) -> {
                    throw new AssertionError("không được gọi");
                }, 0);

        assertThatThrownBy(() -> generator.generate(REQUEST))
                .isInstanceOfSatisfying(BusinessException.class,
                        e -> assertThat(e.getErrorCode()).isEqualTo(ErrorCode.AI_FEEDBACK_UNAVAILABLE));
    }
}
