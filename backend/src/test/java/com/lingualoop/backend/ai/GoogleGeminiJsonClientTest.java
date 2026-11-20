package com.lingualoop.backend.ai;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.io.IOException;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;

import org.junit.jupiter.api.Test;

import com.google.genai.errors.ApiException;
import com.google.genai.errors.GenAiIOException;
import com.lingualoop.backend.ai.GeminiJsonClient.Request;
import com.lingualoop.backend.ai.GeminiJsonClient.Result;
import com.lingualoop.backend.common.exception.BusinessException;
import com.lingualoop.backend.common.exception.ErrorCode;
import com.lingualoop.backend.config.GeminiProperties;

/** Không gọi Gemini thật: lần gọi được thay bằng bản giả để dựng lỗi 503/429. */
class GoogleGeminiJsonClientTest {

    private static final Duration TIMEOUT = Duration.ofSeconds(90);
    private static final Request REQUEST = Request.text("p", TIMEOUT, "LOW");
    private static final Result OK = new Result("{}", 10, 5);

    private final List<String> models = new ArrayList<>();
    private final List<Request> requests = new ArrayList<>();

    private GeminiProperties configured(String fallback) {
        return new GeminiProperties("test-key-not-real", "main-model", fallback, Duration.ofSeconds(20));
    }

    @Test
    void not_configured_throws_unavailable_without_calling() {
        GoogleGeminiJsonClient client = new GoogleGeminiJsonClient(
                new GeminiProperties("", null, null, null), (m, r) -> OK, 0);

        assertThatThrownBy(() -> client.generate(REQUEST)).isInstanceOfSatisfying(BusinessException.class,
                e -> assertThat(e.getErrorCode()).isEqualTo(ErrorCode.AI_FEEDBACK_UNAVAILABLE));
    }

    @Test
    void passes_request_through_and_returns_token_usage() {
        GoogleGeminiJsonClient client = new GoogleGeminiJsonClient(configured(""), (m, r) -> {
            requests.add(r);
            return new Result("{\"ok\":true}", 120, 40);
        }, 0);

        Result result = client.generate(REQUEST);

        assertThat(result).isEqualTo(new Result("{\"ok\":true}", 120, 40));
        assertThat(requests).containsExactly(REQUEST);
    }

    @Test
    void retries_once_on_503_with_fallback_model() {
        int[] calls = {0};
        GoogleGeminiJsonClient client = new GoogleGeminiJsonClient(configured("fallback-model"), (m, r) -> {
            models.add(m);
            if (calls[0]++ == 0) {
                throw new ApiException(503, "UNAVAILABLE", "overloaded");
            }
            return OK;
        }, 0);

        Result result = client.generate(REQUEST);

        assertThat(models).containsExactly("main-model", "fallback-model");
        // báo cho bên gọi biết để các lô sau gọi thẳng model dự phòng
        assertThat(result.byFallback()).isTrue();
    }

    @Test
    void timeout_retries_once_with_fallback_model() {
        int[] calls = {0};
        GoogleGeminiJsonClient client = new GoogleGeminiJsonClient(configured("fallback-model"), (m, r) -> {
            models.add(m);
            if (calls[0]++ == 0) {
                // OkHttp hủy cuộc gọi khi hết callTimeout, SDK bọc lại
                throw new GenAiIOException("Failed to execute HTTP request.", new IOException("Canceled"));
            }
            return OK;
        }, 0);

        Result result = client.generate(REQUEST);

        assertThat(models).containsExactly("main-model", "fallback-model");
        assertThat(result.byFallback()).isTrue();
    }

    @Test
    void second_timeout_is_unavailable() {
        GoogleGeminiJsonClient client = new GoogleGeminiJsonClient(configured("fallback-model"), (m, r) -> {
            models.add(m);
            throw new GenAiIOException("Failed to execute HTTP request.", new IOException("Canceled"));
        }, 0);

        assertThatThrownBy(() -> client.generate(REQUEST)).isInstanceOfSatisfying(BusinessException.class,
                e -> assertThat(e.getErrorCode()).isEqualTo(ErrorCode.AI_FEEDBACK_UNAVAILABLE));
        assertThat(models).containsExactly("main-model", "fallback-model");
    }

    @Test
    void primary_model_answer_is_not_marked_as_fallback() {
        GoogleGeminiJsonClient client = new GoogleGeminiJsonClient(configured("fallback-model"), (m, r) -> OK, 0);

        assertThat(client.generate(REQUEST).byFallback()).isFalse();
    }

    @Test
    void prefer_fallback_calls_fallback_model_first() {
        GoogleGeminiJsonClient client = new GoogleGeminiJsonClient(configured("fallback-model"), (m, r) -> {
            models.add(m);
            return OK;
        }, 0);

        Result result = client.generate(REQUEST.preferringFallback());

        assertThat(models).containsExactly("fallback-model");
        assertThat(result.byFallback()).isTrue();
    }

    @Test
    void overloaded_fallback_retries_with_primary_model() {
        int[] calls = {0};
        GoogleGeminiJsonClient client = new GoogleGeminiJsonClient(configured("fallback-model"), (m, r) -> {
            models.add(m);
            if (calls[0]++ == 0) {
                throw new ApiException(503, "UNAVAILABLE", "overloaded");
            }
            return OK;
        }, 0);

        Result result = client.generate(REQUEST.preferringFallback());

        assertThat(models).containsExactly("fallback-model", "main-model");
        assertThat(result.byFallback()).isFalse();
    }

    @Test
    void prefer_fallback_without_fallback_configured_uses_primary_model() {
        GoogleGeminiJsonClient client = new GoogleGeminiJsonClient(configured(""), (m, r) -> {
            models.add(m);
            return OK;
        }, 0);

        Result result = client.generate(REQUEST.preferringFallback());

        assertThat(models).containsExactly("main-model");
        assertThat(result.byFallback()).isFalse();
    }

    @Test
    void second_overload_is_busy() {
        GoogleGeminiJsonClient client = new GoogleGeminiJsonClient(configured(""), (m, r) -> {
            throw new ApiException(429, "RESOURCE_EXHAUSTED", "quota");
        }, 0);

        assertThatThrownBy(() -> client.generate(REQUEST)).isInstanceOfSatisfying(BusinessException.class,
                e -> assertThat(e.getErrorCode()).isEqualTo(ErrorCode.AI_FEEDBACK_BUSY));
    }

    @Test
    void other_errors_are_not_retried() {
        int[] calls = {0};
        GoogleGeminiJsonClient client = new GoogleGeminiJsonClient(configured(""), (m, r) -> {
            calls[0]++;
            throw new ApiException(400, "INVALID_ARGUMENT", "bad");
        }, 0);

        assertThatThrownBy(() -> client.generate(REQUEST)).isInstanceOfSatisfying(BusinessException.class,
                e -> assertThat(e.getErrorCode()).isEqualTo(ErrorCode.AI_FEEDBACK_UNAVAILABLE));
        assertThat(calls[0]).isEqualTo(1);
    }
}
