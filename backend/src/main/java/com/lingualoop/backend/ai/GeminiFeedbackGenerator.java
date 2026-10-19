package com.lingualoop.backend.ai;

import java.io.UncheckedIOException;
import java.util.function.Consumer;

import org.springframework.stereotype.Service;

import com.lingualoop.backend.common.exception.BusinessException;
import com.lingualoop.backend.common.exception.ErrorCode;
import com.lingualoop.backend.config.GeminiProperties;
import com.google.genai.Client;
import com.google.genai.ResponseStream;
import com.google.genai.types.Content;
import com.google.genai.types.GenerateContentConfig;
import com.google.genai.types.GenerateContentResponse;
import com.google.genai.types.GenerateContentResponseUsageMetadata;
import com.google.genai.types.HttpOptions;
import com.google.genai.types.Part;

import lombok.extern.slf4j.Slf4j;

/** Viết nhận xét bằng Gemini bản văn bản. Chỉ gửi chữ và điểm của lượt đọc, không gửi âm thanh. */
@Slf4j
@Service
class GeminiFeedbackGenerator implements AiFeedbackGenerator {

    /** Nhận xét tối đa 4 câu; chừa dư cho model có bước suy nghĩ nội bộ. */
    private static final int MAX_OUTPUT_TOKENS = 1024;

    private final GeminiProperties properties;
    private volatile Client client;

    GeminiFeedbackGenerator(GeminiProperties properties) {
        this.properties = properties;
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
        StringBuilder all = new StringBuilder();
        Integer inputTokens = null;
        Integer outputTokens = null;
        try (ResponseStream<GenerateContentResponse> stream = client().models.generateContentStream(
                properties.textModel(),
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
        } catch (UncheckedIOException e) {
            throw e; // người học đã rời trang, không phải lỗi của Gemini
        } catch (RuntimeException e) {
            // Ghi gọn một dòng: lỗi quá tải hay hết thời gian chờ thường gặp, không cần cả stack trace
            log.error("Gemini viết nhận xét lỗi (model {}): {}", properties.textModel(), e.toString());
            log.debug("Chi tiết lỗi Gemini", e);
            throw new BusinessException(ErrorCode.AI_FEEDBACK_UNAVAILABLE);
        }
        String content = all.toString().strip();
        if (content.isEmpty()) {
            log.error("Gemini trả nhận xét rỗng (model {})", properties.textModel());
            throw new BusinessException(ErrorCode.AI_FEEDBACK_UNAVAILABLE);
        }
        return new GeneratedFeedback(content, properties.textModel(), FeedbackPromptBuilder.VERSION, inputTokens,
                outputTokens);
    }

    private Client client() {
        Client c = client;
        if (c == null) {
            synchronized (this) {
                if (client == null) {
                    client = Client.builder()
                            .apiKey(properties.apiKey())
                            .httpOptions(HttpOptions.builder().timeout((int) properties.timeout().toMillis()).build())
                            .build();
                }
                c = client;
            }
        }
        return c;
    }
}
