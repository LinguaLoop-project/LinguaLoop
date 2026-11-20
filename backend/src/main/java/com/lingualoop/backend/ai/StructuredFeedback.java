package com.lingualoop.backend.ai;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.lingualoop.backend.common.exception.BusinessException;
import com.lingualoop.backend.common.exception.ErrorCode;

import lombok.extern.slf4j.Slf4j;

/**
 * Chuẩn hóa nhận xét AI dạng JSON (phiên bản 2): bỏ điều AI bịa ngoài dữ liệu, giới hạn số mục và gắn mẹo khẩu hình lấy từ
 * kho mẹo của hệ thống. AI chỉ chọn từ, âm và viết câu mô tả lỗi; không bao giờ tự viết cách đặt lưỡi hay môi, vì mẹo AI
 * viết có thể sai khẩu hình. Kết quả là chuỗi JSON lưu vào {@code ai_feedback.content}; nhận xét cũ là văn xuôi và được
 * giao diện nhận ra qua dấu {@code {} ở đầu.
 */
@Slf4j
final class StructuredFeedback {

    /** Số lỗi ưu tiên tối đa (người học không biết bắt đầu từ đâu nếu cả câu đều bị đánh dấu). */
    static final int MAX_ISSUES = 3;
    private static final int MAX_STRENGTHS = 2;
    private static final int MAX_DERIVED_PHONEMES = 3;
    private static final int MAX_TIPS_PER_ISSUE = 2;
    private static final int MAX_TEXT = 600;
    private static final Set<String> ACTIONS = Set.of("keep_going", "listen_word", "ask_tutor", "retry");
    private static final ObjectMapper JSON = new ObjectMapper();

    private StructuredFeedback() {
    }

    /**
     * @param raw JSON do AI trả (có thể bọc rào mã)
     * @return JSON đã chuẩn hóa
     * @throws BusinessException {@code AI_FEEDBACK_UNAVAILABLE} khi không đọc được hoặc thiếu phần tổng quan
     */
    static String normalize(String raw, FeedbackRequest request) {
        JsonNode node;
        try {
            node = JSON.readTree(stripFence(raw));
        } catch (Exception e) {
            log.error("Gemini trả JSON nhận xét không đọc được: {}", e.getMessage());
            throw new BusinessException(ErrorCode.AI_FEEDBACK_UNAVAILABLE);
        }
        String summary = text(node.path("summary"));
        if (summary.isEmpty()) {
            log.error("Nhận xét AI thiếu phần tổng quan");
            throw new BusinessException(ErrorCode.AI_FEEDBACK_UNAVAILABLE);
        }

        Map<String, FeedbackRequest.Word> words = new LinkedHashMap<>();
        for (FeedbackRequest.Word w : request.words()) {
            words.putIfAbsent(key(w.text()), w);
        }
        // Âm AI nêu có thể là âm Azure báo (/d/) hay âm đích (/ð/); luôn quy về âm đích để hiện và gắn mẹo cho đúng âm cần luyện
        Map<String, String> targetOf = new LinkedHashMap<>();
        request.words().forEach(w -> w.weakPhonemes().forEach(p -> {
            String target = p.expected() != null ? p.expected() : p.symbol();
            targetOf.putIfAbsent(target, target);
            targetOf.putIfAbsent(p.symbol(), target);
        }));

        List<Map<String, Object>> issues = new ArrayList<>();
        Set<String> issueWords = new LinkedHashSet<>();
        for (JsonNode issue : node.path("issues")) {
            if (issues.size() == MAX_ISSUES) {
                break;
            }
            List<String> issueWordList = known(issue.path("words"), words.keySet(), words);
            String problem = text(issue.path("problem"));
            if (issueWordList.isEmpty() || problem.isEmpty()) {
                continue; // lỗi không gắn với từ nào của câu: AI bịa, bỏ
            }
            List<String> phonemes = new ArrayList<>();
            for (JsonNode p : issue.path("phonemes")) {
                String target = targetOf.get(p.asText("").strip());
                if (target != null && !phonemes.contains(target)) {
                    phonemes.add(target);
                }
            }
            if (phonemes.isEmpty()) {
                // AI hay để trống: lấy âm yếu của chính các từ đó theo dữ liệu chấm, để vẫn có mẹo khẩu hình đúng
                for (String shown : issueWordList) {
                    for (FeedbackRequest.Phoneme p : words.get(key(shown)).weakPhonemes()) {
                        String target = p.expected() != null ? p.expected() : p.symbol();
                        if (!phonemes.contains(target) && phonemes.size() < MAX_DERIVED_PHONEMES) {
                            phonemes.add(target);
                        }
                    }
                }
            }
            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("words", issueWordList);
            entry.put("phonemes", phonemes);
            entry.put("problem", problem);
            // Mẹo của từng âm trong lỗi (tối đa 2): mẹo lấy từ kho của hệ thống, gắn kèm ký hiệu âm để người học biết mẹo nào cho âm nào
            List<Map<String, String>> tips = new ArrayList<>();
            for (String symbol : phonemes) {
                String tip = request.tips().get(symbol);
                if (tip != null && !tip.isBlank() && tips.size() < MAX_TIPS_PER_ISSUE) {
                    tips.add(Map.of("phoneme", symbol, "text", tip));
                }
            }
            entry.put("tips", tips);
            issues.add(entry);
            issueWords.addAll(issueWordList);
        }

        List<String> omitted = new ArrayList<>();
        for (String w : known(node.path("omitted"), words.keySet(), words)) {
            if ("omitted".equals(words.get(key(w)).outcome())) {
                omitted.add(w);
            }
        }

        List<String> strengths = new ArrayList<>();
        for (JsonNode s : node.path("strengths")) {
            String t = text(s);
            if (!t.isEmpty() && strengths.size() < MAX_STRENGTHS) {
                strengths.add(t);
            }
        }

        Map<String, Object> out = new LinkedHashMap<>();
        out.put("v", 2);
        out.put("summary", summary);
        out.put("strengths", strengths);
        out.put("issues", issues);
        out.put("omitted", omitted);
        out.put("next", next(node.path("next"), issues, issueWords, words));
        try {
            return JSON.writeValueAsString(out);
        } catch (Exception e) {
            throw new BusinessException(ErrorCode.AI_FEEDBACK_UNAVAILABLE);
        }
    }

    /** Bước tiếp theo: hành động hợp lệ và từ (nếu có) phải thuộc các từ có lỗi; sai thì đổi về cách an toàn. */
    private static Map<String, Object> next(JsonNode node, List<Map<String, Object>> issues, Set<String> issueWords,
            Map<String, FeedbackRequest.Word> words) {
        String action = node.path("action").asText("").strip();
        if (!ACTIONS.contains(action)) {
            action = issues.isEmpty() ? "keep_going" : "retry";
        }
        String word = null;
        if ("listen_word".equals(action)) {
            String asked = node.path("word").asText("").strip();
            word = issueWords.stream().filter(w -> key(w).equals(key(asked))).findFirst()
                    .orElse(issueWords.stream().findFirst().orElse(null));
            if (word == null) {
                action = "retry"; // không có từ nào để nghe lại
            }
        }
        Map<String, Object> next = new LinkedHashMap<>();
        next.put("action", action);
        next.put("word", word);
        return next;
    }

    /** Các từ AI nêu mà có trong câu, viết đúng như trong câu mẫu; bỏ từ lạ và từ trùng. */
    private static List<String> known(JsonNode array, Set<String> allowed, Map<String, FeedbackRequest.Word> words) {
        List<String> out = new ArrayList<>();
        for (JsonNode n : array) {
            String k = key(n.asText(""));
            if (allowed.contains(k)) {
                String shown = words.get(k).text();
                if (!out.contains(shown)) {
                    out.add(shown);
                }
            }
        }
        return out;
    }

    private static String key(String word) {
        return word == null ? "" : word.strip().toLowerCase(Locale.ROOT);
    }

    private static String text(JsonNode node) {
        String t = node.asText("").strip();
        return t.length() <= MAX_TEXT ? t : t.substring(0, MAX_TEXT);
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
