package com.lingualoop.backend.ai;

import org.springframework.stereotype.Service;

import com.lingualoop.backend.common.exception.BusinessException;
import com.lingualoop.backend.common.exception.ErrorCode;
import com.lingualoop.backend.config.GeminiProperties;
import com.google.genai.Client;
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
        if (!properties.configured()) {
            log.error("Gemini chưa cấu hình (GEMINI_API_KEY trống)");
            throw new BusinessException(ErrorCode.AI_FEEDBACK_UNAVAILABLE);
        }
        try {
            GenerateContentResponse response = client().models.generateContent(
                    properties.textModel(),
                    FeedbackPromptBuilder.userPrompt(request),
                    GenerateContentConfig.builder()
                            .systemInstruction(Content.fromParts(Part.fromText(FeedbackPromptBuilder.systemInstruction())))
                            .temperature(0.4f)
                            .maxOutputTokens(MAX_OUTPUT_TOKENS)
                            .build());
            String text = response.text();
            if (text == null || text.isBlank()) {
                log.error("Gemini trả nhận xét rỗng (model {})", properties.textModel());
                throw new BusinessException(ErrorCode.AI_FEEDBACK_UNAVAILABLE);
            }
            GenerateContentResponseUsageMetadata usage = response.usageMetadata().orElse(null);
            return new GeneratedFeedback(text.strip(), properties.textModel(), FeedbackPromptBuilder.VERSION,
                    usage == null ? null : usage.promptTokenCount().orElse(null),
                    usage == null ? null : usage.candidatesTokenCount().orElse(null));
        } catch (BusinessException e) {
            throw e;
        } catch (RuntimeException e) {
            log.error("Gemini viết nhận xét lỗi", e);
            throw new BusinessException(ErrorCode.AI_FEEDBACK_UNAVAILABLE);
        }
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
