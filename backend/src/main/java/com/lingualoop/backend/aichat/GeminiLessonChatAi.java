package com.lingualoop.backend.aichat;

import java.util.List;

import org.springframework.stereotype.Service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.lingualoop.backend.ai.GeminiJsonClient;
import com.lingualoop.backend.ai.GeminiJsonClient.Request;
import com.lingualoop.backend.ai.GeminiJsonClient.Result;
import com.lingualoop.backend.common.exception.BusinessException;
import com.lingualoop.backend.common.exception.ErrorCode;
import com.lingualoop.backend.config.GeminiProperties;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Gia sư AI chế độ chat chữ bằng Gemini: mỗi lượt một lần gọi trả JSON; thử lại khi quá tải do {@link GeminiJsonClient}
 * lo. Cũng tạo gợi ý và nhận xét tổng quát cho chế độ giọng nói.
 */
@Slf4j
@Service
@RequiredArgsConstructor
class GeminiLessonChatAi implements LessonChatAi {

    private static final ObjectMapper JSON = new ObjectMapper();
    private static final String THINKING = "LOW";

    private final GeminiJsonClient gemini;
    private final GeminiProperties properties;

    @Override
    public Generated<String> open(Lesson lesson) {
        Result result = call(lesson, LessonChatPrompts.open());
        return generated(result, text(parse(result), "question"));
    }

    @Override
    public Generated<Reply> reply(Lesson lesson, List<Line> history, String answer, boolean finalTurn) {
        Result result = call(lesson, LessonChatPrompts.reply(history, answer, finalTurn));
        JsonNode node = parse(result);
        String feedback = text(node, "feedback");
        String next = finalTurn ? "" : text(node, "nextQuestion");
        return generated(result, new Reply(feedback, node.path("better").asText("").strip(), next));
    }

    @Override
    public Generated<String> hint(Lesson lesson, List<Line> history) {
        Result result = call(lesson, LessonChatPrompts.hint(history));
        return generated(result, text(parse(result), "hint"));
    }

    @Override
    public Generated<String> summarize(Lesson lesson, List<Line> history) {
        Result result = call(lesson, LessonChatPrompts.summary(history));
        return generated(result, text(parse(result), "summary"));
    }

    private Result call(Lesson lesson, String prompt) {
        return gemini.generate(
                new Request(LessonChatPrompts.system(lesson), prompt, null, properties.timeout(), THINKING, false));
    }

    private static <T> Generated<T> generated(Result result, T value) {
        return new Generated<>(value, result.inputTokens(), result.outputTokens());
    }

    private static JsonNode parse(Result result) {
        try {
            return JSON.readTree(stripFence(result.json()));
        } catch (Exception e) {
            log.error("Gemini trả JSON không đọc được cho gia sư AI: {}", e.getMessage());
            throw new BusinessException(ErrorCode.AI_FEEDBACK_UNAVAILABLE);
        }
    }

    /** Lấy một trường chữ bắt buộc; thiếu hoặc rỗng nghĩa là lượt hỏng, không lưu và không trừ credit. */
    private static String text(JsonNode node, String field) {
        String value = node.path(field).asText("").strip();
        if (value.isEmpty()) {
            log.error("Gemini thiếu trường {} trong kết quả gia sư AI", field);
            throw new BusinessException(ErrorCode.AI_FEEDBACK_UNAVAILABLE);
        }
        return value;
    }

    private static String stripFence(String json) {
        String s = json.strip();
        if (s.startsWith("```")) {
            int start = s.indexOf('\n');
            int end = s.lastIndexOf("```");
            if (start >= 0 && end > start) {
                s = s.substring(start + 1, end).strip();
            }
        }
        return s;
    }
}
