package com.lingualoop.backend.ai;

import java.io.UncheckedIOException;
import java.util.function.Consumer;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.google.genai.Client;
import com.google.genai.ResponseStream;
import com.google.genai.errors.ApiException;
import com.google.genai.types.Content;
import com.google.genai.types.GenerateContentConfig;
import com.google.genai.types.GenerateContentResponse;
import com.google.genai.types.GenerateContentResponseUsageMetadata;
import com.google.genai.types.HttpOptions;
import com.google.genai.types.HttpRetryOptions;
import com.google.genai.types.Part;
import com.lingualoop.backend.common.exception.BusinessException;
import com.lingualoop.backend.common.exception.ErrorCode;
import com.lingualoop.backend.config.GeminiProperties;

import lombok.extern.slf4j.Slf4j;

/**
 * Viết nhận xét bằng Gemini bản văn bản. Chỉ gửi chữ và điểm của lượt đọc, không gửi âm thanh.
 * <p>
 * Gemini hay trả 503/429 khi quá tải. SDK của Google mặc định tự thử lại ngầm trong giới hạn thời gian chờ nên người
 * học phải đợi cả chục giây rồi nhận lỗi I/O mờ nhạt; ở đây tắt việc đó và tự thử lại đúng một lần sau
 * {@link #RETRY_DELAY_MS} (dùng model dự phòng nếu có cấu hình), chỉ khi chưa gửi chữ nào cho người học.
 */
@Slf4j
@Service
class GeminiFeedbackGenerator implements AiFeedbackGenerator {

    /** Nhận xét tối đa 4 câu; chừa dư cho model có bước suy nghĩ nội bộ. */
    private static final int MAX_OUTPUT_TOKENS = 1024;

    private static final long RETRY_DELAY_MS = 1_000;

    /** Một lần gọi Gemini bằng model {@code model}; tách ra để test dựng lỗi 503/429 mà không cần gọi thật. */
    @FunctionalInterface
    interface Attempt {
        GeneratedFeedback run(String model, FeedbackRequest request, Consumer<String> onText);
    }

    private final GeminiProperties properties;
    private final Attempt attempt;
    private final long retryDelayMs;
    private volatile Client client;

    @Autowired
    GeminiFeedbackGenerator(GeminiProperties properties) {
        this.properties = properties;
        this.attempt = this::callGemini;
        this.retryDelayMs = RETRY_DELAY_MS;
    }

    GeminiFeedbackGenerator(GeminiProperties properties, Attempt attempt, long retryDelayMs) {
        this.properties = properties;
        this.attempt = attempt;
        this.retryDelayMs = retryDelayMs;
    }

    @Override
    public GeneratedFeedback generate(FeedbackRequest request) {
        return generate(request, text -> { });
    }

    @Override
    public GeneratedFeedback generate(FeedbackRequest request, Consumer<String> onText) {
        if (!properties.configured()) {
            log.error("Gemini chưa cấu hình (GEMINI_API_KEY trống)");
            throw new BusinessException(ErrorCode.AI_FEEDBACK_UNAVAILABLE);
        }
        int[] sent = {0};
        Consumer<String> counting = text -> {
            sent[0] += text.length();
            onText.accept(text);
        };

        String model = properties.textModel();
        try {
            return attempt.run(model, request, counting);
        } catch (RuntimeException first) {
            // Đã gửi chữ cho người học thì không thể viết lại từ đầu mà không lặp chữ
            if (!isOverloaded(first) || sent[0] > 0) {
                throw translate(first, model);
            }
            String second = properties.fallbackModel().isEmpty() ? model : properties.fallbackModel();
            log.warn("Gemini quá tải (model {}, mã {}), thử lại một lần với model {}", model, codeOf(first), second);
            pause();
            try {
                return attempt.run(second, request, counting);
            } catch (RuntimeException retry) {
                throw translate(retry, second);
            }
        }
    }

    private GeneratedFeedback callGemini(String model, FeedbackRequest request, Consumer<String> onText) {
        StringBuilder all = new StringBuilder();
        Integer inputTokens = null;
        Integer outputTokens = null;
        try (ResponseStream<GenerateContentResponse> stream = client().models.generateContentStream(
                model,
                FeedbackPromptBuilder.userPrompt(request),
                GenerateContentConfig.builder()
                        .systemInstruction(Content.fromParts(Part.fromText(FeedbackPromptBuilder.systemInstruction())))
                        .temperature(0.4f)
                        .maxOutputTokens(MAX_OUTPUT_TOKENS)
                        .build())) {
            for (GenerateContentResponse chunk : stream) {
                String text = chunk.text();
                if (text != null && !text.isEmpty()) {
                    all.append(text);
                    onText.accept(text);
                }
                GenerateContentResponseUsageMetadata usage = chunk.usageMetadata().orElse(null);
                if (usage != null) {
                    inputTokens = usage.promptTokenCount().orElse(inputTokens);
                    outputTokens = usage.candidatesTokenCount().orElse(outputTokens);
                }
            }
        }
        String content = all.toString().strip();
        if (content.isEmpty()) {
            log.error("Gemini trả nhận xét rỗng (model {})", model);
            throw new BusinessException(ErrorCode.AI_FEEDBACK_UNAVAILABLE);
        }
        return new GeneratedFeedback(content, model, FeedbackPromptBuilder.VERSION, inputTokens, outputTokens);
    }

    /** 503 (quá tải) hoặc 429 (vượt hạn mức): đáng thử lại. Hết thời gian chờ thì không, vì sẽ chờ gấp đôi. */
    private static boolean isOverloaded(RuntimeException error) {
        return error instanceof ApiException api && (api.code() == 503 || api.code() == 429);
    }

    private static String codeOf(RuntimeException error) {
        return error instanceof ApiException api ? String.valueOf(api.code()) : "?";
    }

    /** Đổi lỗi của SDK thành lỗi nghiệp vụ cho người học, ghi log gọn một dòng có mã lỗi và nguyên nhân gốc. */
    private RuntimeException translate(RuntimeException error, String model) {
        if (error instanceof UncheckedIOException || error instanceof BusinessException) {
            return error; // người học đã rời trang, hoặc lỗi nghiệp vụ đã ghi log
        }
        Throwable root = error;
        while (root.getCause() != null && root.getCause() != root) {
            root = root.getCause();
        }
        log.error("Gemini viết nhận xét lỗi (model {}, mã {}): {} | nguyên nhân gốc: {}", model, codeOf(error),
                error.getMessage(), root);
        log.debug("Chi tiết lỗi Gemini", error);
        return new BusinessException(isOverloaded(error) ? ErrorCode.AI_FEEDBACK_BUSY : ErrorCode.AI_FEEDBACK_UNAVAILABLE);
    }

    private void pause() {
        try {
            Thread.sleep(retryDelayMs);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }

    private Client client() {
        Client c = client;
        if (c == null) {
            synchronized (this) {
                if (client == null) {
                    client = Client.builder()
                            .apiKey(properties.apiKey())
                            .httpOptions(HttpOptions.builder()
                                    .timeout((int) properties.timeout().toMillis())
                                    // Tự thử lại ở generate() để kiểm soát thời gian chờ, không để SDK thử ngầm
                                    .retryOptions(HttpRetryOptions.builder().attempts(1).build())
                                    .build())
                            .build();
                }
                c = client;
            }
        }
        return c;
    }
}
