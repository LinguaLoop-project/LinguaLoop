package com.lingualoop.backend.ai;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.google.genai.Client;
import com.google.genai.errors.ApiException;
import com.google.genai.types.Content;
import com.google.genai.types.FileData;
import com.google.genai.types.GenerateContentConfig;
import com.google.genai.types.GenerateContentResponse;
import com.google.genai.types.GenerateContentResponseUsageMetadata;
import com.google.genai.types.HttpOptions;
import com.google.genai.types.HttpRetryOptions;
import com.google.genai.types.MediaResolution;
import com.google.genai.types.Part;
import com.google.genai.types.ThinkingConfig;
import com.google.genai.types.ThinkingLevel;
import com.google.genai.types.VideoMetadata;
import com.lingualoop.backend.common.exception.BusinessException;
import com.lingualoop.backend.common.exception.ErrorCode;
import com.lingualoop.backend.config.GeminiProperties;

import lombok.extern.slf4j.Slf4j;

/**
 * Gọi Gemini với {@code responseMimeType=application/json}. Giống {@link GeminiFeedbackGenerator}: tắt việc tự thử lại
 * ngầm của SDK và tự thử lại đúng một lần khi Gemini trả 429/503 hoặc quá thời gian chờ bằng model còn lại trong cặp chính/dự phòng (nếu có
 * cấu hình dự phòng). Kết quả báo có phải do model dự phòng trả không để việc gọi nhiều lô đi thẳng vào nó. Thời gian chờ
 * lấy theo từng lần gọi vì nghe một đoạn video lâu hơn nhiều so với viết một đoạn nhận xét.
 * <p>
 * Đoạn video đi dưới dạng {@code fileData} trỏ thẳng tới link YouTube kèm {@code videoMetadata} (mốc đầu, mốc cuối);
 * độ phân giải hình đặt thấp vì chỉ cần nghe tiếng, giảm số token phải trả.
 */
@Slf4j
@Service
class GoogleGeminiJsonClient implements GeminiJsonClient {

    private static final long RETRY_DELAY_MS = 1_000;

    /** Nhiệt độ thấp: chép lời và dịch cần ổn định, không cần sáng tạo. */
    private static final float TEMPERATURE = 0.1f;

    /** Một lần gọi bằng model {@code model}; tách ra để test dựng lỗi 503/429 mà không cần gọi thật. */
    @FunctionalInterface
    interface Attempt {
        Result run(String model, Request request);
    }

    private final GeminiProperties properties;
    private final Attempt attempt;
    private final long retryDelayMs;
    private volatile Client client;

    @Autowired
    GoogleGeminiJsonClient(GeminiProperties properties) {
        this.properties = properties;
        this.attempt = this::callGemini;
        this.retryDelayMs = RETRY_DELAY_MS;
    }

    GoogleGeminiJsonClient(GeminiProperties properties, Attempt attempt, long retryDelayMs) {
        this.properties = properties;
        this.attempt = attempt;
        this.retryDelayMs = retryDelayMs;
    }

    @Override
    public Result generate(Request request) {
        if (!properties.configured()) {
            log.error("Gemini chưa cấu hình (GEMINI_API_KEY trống)");
            throw new BusinessException(ErrorCode.AI_FEEDBACK_UNAVAILABLE);
        }
        String primary = properties.textModel();
        String fallback = properties.fallbackModel().isEmpty() ? primary : properties.fallbackModel();
        // Gọi model dự phòng trước nếu lần gọi trước đã phải dùng nó; quá tải thì thử lại bằng model còn lại
        String model = request.preferFallback() ? fallback : primary;
        String other = model.equals(primary) ? fallback : primary;
        try {
            return run(model, fallback, request);
        } catch (RuntimeException first) {
            if (!isOverloaded(first) && !isTimeout(first)) {
                throw translate(first, model);
            }
            log.warn("Gemini quá tải hoặc quá thời gian chờ (model {}, mã {}), thử lại một lần với model {}", model,
                    codeOf(first), other);
            pause();
            try {
                return run(other, fallback, request);
            } catch (RuntimeException retry) {
                throw translate(retry, other);
            }
        }
    }

    private Result run(String model, String fallback, Request request) {
        Result result = attempt.run(model, request);
        boolean byFallback = !properties.fallbackModel().isEmpty() && model.equals(fallback);
        return byFallback ? result.fromFallback() : result;
    }

    private Result callGemini(String model, Request request) {
        List<Part> parts = new ArrayList<>(2);
        GenerateContentConfig.Builder config = GenerateContentConfig.builder()
                .responseMimeType("application/json")
                .temperature(TEMPERATURE)
                .httpOptions(HttpOptions.builder().timeout((int) request.timeout().toMillis()).build());
        if (request.video() != null) {
            VideoClip video = request.video();
            VideoMetadata.Builder clip = VideoMetadata.builder().startOffset(video.start()).endOffset(video.end());
            if (video.fps() != null) {
                clip.fps(video.fps());
            }
            parts.add(Part.builder()
                    .fileData(FileData.builder().fileUri(video.fileUri()).build())
                    .videoMetadata(clip.build())
                    .build());
            config.mediaResolution(MediaResolution.Known.MEDIA_RESOLUTION_LOW);
        }
        if (request.thinkingLevel() != null) {
            // Dòng Gemini 3.x dùng thinkingLevel; thinkingBudget = 0 bị model như 3.5 Flash-Lite từ chối (400)
            config.thinkingConfig(ThinkingConfig.builder()
                    .thinkingLevel(ThinkingLevel.Known.valueOf(request.thinkingLevel())).build());
        }
        if (request.audio() != null) {
            parts.add(Part.fromBytes(request.audio().data(), request.audio().mimeType()));
        }
        parts.add(Part.fromText(request.prompt()));
        if (request.systemInstruction() != null) {
            config.systemInstruction(Content.fromParts(Part.fromText(request.systemInstruction())));
        }

        GenerateContentResponse response = client().models.generateContent(model,
                Content.fromParts(parts.toArray(Part[]::new)), config.build());
        String text = response.text();
        if (text == null || text.isBlank()) {
            log.error("Gemini trả JSON rỗng (model {})", model);
            throw new BusinessException(ErrorCode.AI_FEEDBACK_UNAVAILABLE);
        }
        GenerateContentResponseUsageMetadata usage = response.usageMetadata().orElse(null);
        long input = usage == null ? 0 : usage.promptTokenCount().orElse(0);
        // Token suy nghĩ nội bộ cũng tính tiền như token trả lời
        long output = usage == null ? 0
                : usage.candidatesTokenCount().orElse(0) + (long) usage.thoughtsTokenCount().orElse(0);
        log.info("Gemini JSON (model {}{}): {} token vào, {} token ra", model,
                request.video() == null ? "" : ", có video", input, output);
        return new Result(text, input, output);
    }

    /** 503 (quá tải) hoặc 429 (vượt hạn mức): đáng thử lại. */
    private static boolean isOverloaded(RuntimeException error) {
        return error instanceof ApiException api && (api.code() == 503 || api.code() == 429);
    }

    /**
     * Không nhận được trả lời trong thời gian chờ: OkHttp hủy cuộc gọi ({@code IOException: Canceled}) hoặc hết giờ đọc
     * ({@code SocketTimeoutException}), SDK bọc thành {@code GenAiIOException}. Gemini quá tải có lúc treo request thay vì
     * trả 503 nên cũng đáng thử lại bằng model còn lại.
     */
    private static boolean isTimeout(RuntimeException error) {
        for (Throwable t = error; t != null; t = t.getCause() == t ? null : t.getCause()) {
            if (t instanceof IOException) {
                return true;
            }
        }
        return false;
    }

    private static String codeOf(RuntimeException error) {
        return error instanceof ApiException api ? String.valueOf(api.code()) : "?";
    }

    private static RuntimeException translate(RuntimeException error, String model) {
        if (error instanceof BusinessException) {
            return error;
        }
        Throwable root = error;
        while (root.getCause() != null && root.getCause() != root) {
            root = root.getCause();
        }
        log.error("Gemini trả JSON lỗi (model {}, mã {}): {} | nguyên nhân gốc: {}", model, codeOf(error),
                error.getMessage(), root);
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
