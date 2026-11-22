package com.lingualoop.backend.lesson.transcript;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Component;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.lingualoop.backend.ai.GeminiJsonClient;
import com.lingualoop.backend.ai.GeminiJsonClient.Request;
import com.lingualoop.backend.ai.GeminiJsonClient.Result;
import com.lingualoop.backend.common.exception.BusinessException;
import com.lingualoop.backend.config.LessonImportProperties;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Gợi ý bản dịch tiếng Việt bằng Gemini (UC-BH-10).
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class SentenceTranslator {

    /** Kết quả gợi ý dịch. */
    public enum Outcome {
        /** Mọi câu đã có bản dịch. */
        COMPLETE,
        /** Gemini lỗi; các câu chưa dịch để trống. */
        AI_FAILED
    }

    /**
     * @param translations cùng số phần tử với đầu vào; câu chưa dịch là {@code null}
     * @param inputTokens tổng đơn vị xử lý đầu vào của các lô đã trả về, để ghi chi phí thật (BR-GA-12)
     * @param outputTokens tổng đơn vị xử lý đầu ra, gồm cả phần suy nghĩ nội bộ
     */
    public record Translation(List<String> translations, Outcome outcome, long inputTokens, long outputTokens) {

        public long translatedCount() {
            return translations.stream().filter(t -> t != null).count();
        }
    }

    private static final int CONTEXT_SENTENCES = 3;
    private static final ObjectMapper JSON = new ObjectMapper();

    static final String PROMPT = """
            Translate the English sentences below into natural Vietnamese for language learners. They are \
            consecutive sentences from one spoken video, so keep the translation consistent: use the same forms of \
            address (for example the same pronouns for the speaker and the audience) and the same terms throughout.

            Rules:
            - Translate meaning naturally, not word for word. Keep proper names as they are.
            - Return exactly one translation for every id. Never skip, merge or split items.
            - Keep forms of address consistent with the previous translations given as context.

            Return ONLY JSON of the form {"items":[{"id":N,"vi":"..."}]}.
            """;

    private final GeminiJsonClient gemini;
    private final LessonImportProperties properties;

    public Translation translate(List<String> sentences) {
        String[] result = new String[sentences.size()];
        int batchSize = properties.translateBatchSize();
        Outcome outcome = Outcome.COMPLETE;
        // Model chính quá tải ở một lô thì các lô sau gọi thẳng model dự phòng, khỏi mất thêm một lần 503 mỗi lô
        boolean preferFallback = false;
        long inputTokens = 0;
        long outputTokens = 0;

        for (int from = 0; from < sentences.size(); from += batchSize) {
            int to = Math.min(from + batchSize, sentences.size());
            Request request = Request.text(prompt(sentences, result, from, to), properties.translateTimeout(),
                    properties.thinkingLevel());
            Result reply;
            try {
                reply = gemini.generate(preferFallback ? request.preferringFallback() : request);
                preferFallback = reply.byFallback();
                inputTokens += reply.inputTokens();
                outputTokens += reply.outputTokens();
            } catch (BusinessException e) {
                log.warn("Gemini dịch lô {}-{} lỗi: {}", from, to, e.getErrorCode());
                outcome = Outcome.AI_FAILED;
                break;
            }
            if (collect(reply.json(), from, to, result) == 0) {
                // JSON hỏng: coi như lỗi hệ thống
                outcome = Outcome.AI_FAILED;
                break;
            }
        }
        return new Translation(Arrays.asList(result), outcome, inputTokens, outputTokens);
    }

    private static String prompt(List<String> sentences, String[] translated, int from, int to) {
        StringBuilder prompt = new StringBuilder(PROMPT);
        if (from > 0) {
            prompt.append("\nPREVIOUS TRANSLATIONS (context only, do not return them):\n");
            for (int i = Math.max(0, from - CONTEXT_SENTENCES); i < from; i++) {
                if (translated[i] != null) {
                    prompt.append("- ").append(sentences.get(i)).append(" => ").append(translated[i]).append('\n');
                }
            }
        }
        List<Map<String, Object>> items = new ArrayList<>(to - from);
        for (int i = from; i < to; i++) {
            items.add(Map.of("id", i, "text", sentences.get(i)));
        }
        try {
            return prompt.append("\nINPUT:\n").append(JSON.writeValueAsString(items)).toString();
        } catch (JsonProcessingException e) {
            throw new IllegalStateException(e);
        }
    }

    /** Bỏ khối {@code ```json ... ```} nếu model bọc JSON trong markdown. */
    static String stripFence(String text) {
        if (text == null) {
            return "";
        }
        String t = text.strip();
        if (t.startsWith("```")) {
            int firstLine = t.indexOf('\n');
            t = firstLine < 0 ? "" : t.substring(firstLine + 1);
            int close = t.lastIndexOf("```");
            if (close >= 0) {
                t = t.substring(0, close);
            }
        }
        return t.strip();
    }

    /** Ghi bản dịch nhận được vào {@code result}; trả số câu đã điền. JSON hỏng coi như không nhận được câu nào. */
    private static int collect(String json, int from, int to, String[] result) {
        int filled = 0;
        try {
            for (JsonNode item : JSON.readTree(stripFence(json)).path("items")) {
                int id = item.path("id").asInt(-1);
                String vi = item.path("vi").asText("").strip();
                if (id >= from && id < to && !vi.isEmpty() && result[id] == null) {
                    result[id] = vi.length() > 500 ? vi.substring(0, 500) : vi;
                    filled++;
                }
            }
        } catch (JsonProcessingException | RuntimeException e) {
            log.warn("Gemini trả bản dịch không đọc được: {}", e.toString());
        }
        return filled;
    }
}
