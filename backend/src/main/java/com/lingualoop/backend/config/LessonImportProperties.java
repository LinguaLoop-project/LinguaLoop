package com.lingualoop.backend.config;

import java.time.Duration;
import java.util.Locale;
import java.util.Set;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Bind từ {@code app.lesson-import}: tạo bài học từ link YouTube (UC-BH-03).
 *
 * @param youtubeApiKey      khóa YouTube Data API v3, dùng để đọc thời lượng, trạng thái và tiêu đề video
 * @param youtubeApiUrl      gốc URL của YouTube Data API (đổi được để test dùng WireMock)
 * @param espeakPath         đường dẫn chương trình espeak-ng tạo IPA
 * @param espeakTimeout      thời gian chờ tối đa của một lệnh espeak-ng
 * @param maxDuration        thời lượng video tối đa (BR-BH-17)
 * @param translateBatchSize số câu mỗi lần gọi Gemini gợi ý dịch (UC-BH-10); credit được kiểm tra trước mỗi lô
 * @param translateTimeout   thời gian chờ tối đa của một lô dịch
 * @param thinkingLevel      mức suy nghĩ nội bộ của Gemini khi dịch: {@code minimal}, {@code low}, {@code medium},
 *                           {@code high}; mặc định {@code low} (nhanh, rẻ, cả 3.8 Flash lẫn 3.5 Flash-Lite đều nhận).
 *                           Chuỗi rỗng = để model tự quyết. Phải là mức cả model chính lẫn model dự phòng hỗ trợ
 * @param transcriptApiKey   khóa TranscriptAPI, gửi trong header {@code Authorization: Bearer}
 * @param transcriptApiUrl   gốc URL của TranscriptAPI (đổi được để test dùng WireMock)
 */
@ConfigurationProperties("app.lesson-import")
public record LessonImportProperties(String youtubeApiKey, String youtubeApiUrl, String espeakPath,
        Duration espeakTimeout, Duration maxDuration, Integer translateBatchSize, Duration translateTimeout,
        String thinkingLevel, String transcriptApiKey, String transcriptApiUrl) {

    private static final Set<String> THINKING_LEVELS = Set.of("MINIMAL", "LOW", "MEDIUM", "HIGH");

    public LessonImportProperties {
        youtubeApiKey = youtubeApiKey == null ? "" : youtubeApiKey.trim();
        youtubeApiUrl = youtubeApiUrl == null || youtubeApiUrl.isBlank()
                ? "https://www.googleapis.com/youtube/v3" : youtubeApiUrl.trim();
        espeakPath = espeakPath == null || espeakPath.isBlank() ? "espeak-ng" : espeakPath.trim();
        espeakTimeout = espeakTimeout == null ? Duration.ofSeconds(30) : espeakTimeout;
        maxDuration = maxDuration == null ? Duration.ofMinutes(15) : maxDuration;
        translateBatchSize = translateBatchSize == null || translateBatchSize < 1 ? 20 : translateBatchSize;
        translateTimeout = translateTimeout == null ? Duration.ofSeconds(30) : translateTimeout;
        thinkingLevel = normalizeThinkingLevel(thinkingLevel);
        transcriptApiKey = transcriptApiKey == null ? "" : transcriptApiKey.trim();
        transcriptApiUrl = transcriptApiUrl == null || transcriptApiUrl.isBlank()
                ? "https://transcriptapi.com/api/v2" : transcriptApiUrl.trim();
    }

    /** Mọi giá trị mặc định; dùng trong test. */
    public static LessonImportProperties defaults() {
        return withBatchSize(null);
    }

    /** Mặc định, chỉ đổi số câu mỗi lô dịch; dùng trong test. */
    public static LessonImportProperties withBatchSize(Integer translateBatchSize) {
        return new LessonImportProperties(null, null, null, null, null, translateBatchSize, null, null, null, null);
    }

    /** {@code null} = mặc định LOW; rỗng = để model tự quyết; sai giá trị thì app không khởi động. */
    private static String normalizeThinkingLevel(String level) {
        if (level == null) {
            return "LOW";
        }
        if (level.isBlank()) {
            return null;
        }
        String upper = level.strip().toUpperCase(Locale.ROOT);
        if (!THINKING_LEVELS.contains(upper)) {
            throw new IllegalArgumentException("app.lesson-import.thinking-level phải là một trong " + THINKING_LEVELS
                    + " hoặc rỗng, nhận: " + level);
        }
        return upper;
    }

    public boolean transcriptApiConfigured() {
        return !transcriptApiKey.isEmpty();
    }

    public boolean youtubeConfigured() {
        return !youtubeApiKey.isEmpty();
    }
}
