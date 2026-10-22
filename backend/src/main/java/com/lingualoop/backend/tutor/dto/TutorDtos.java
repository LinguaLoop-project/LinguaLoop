package com.lingualoop.backend.tutor.dto;

import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.lingualoop.backend.tutor.PracticeWord;
import com.lingualoop.backend.tutor.TutorThresholds;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/** Request và response của {@code /api/v1/tutor}. Giá trị enum gửi dạng chữ thường ({@code next_word}, {@code passed}). */
public final class TutorDtos {

    private TutorDtos() {
    }

    public record OfferRequest(@NotNull Long attemptId) {
    }

    /** @param words Danh sách từ lỗi, để giao diện nói rõ vì sao gia sư mở; rỗng khi {@code offer = false} */
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record OfferResponse(boolean offer, String reason, UUID offerId, List<PracticeWord> words) {
    }

    /** @param offerId null khi học viên tự bấm "Hỏi gia sư" */
    public record CreateSessionRequest(@NotNull Long attemptId, UUID offerId) {
    }

    public record LessonEventRequest(@NotNull UUID lessonId, @NotBlank String event) {
    }

    public record Limits(int maxSeconds, int wrapUpAtSeconds, int startTimeoutSeconds, int maxAttemptsPerWord,
            int maxSentenceAttempts, int idleAskSeconds, int idleEndSeconds, int offTopicEndStreak) {

        public static Limits current() {
            return new Limits(TutorThresholds.SESSION_MAX_SECONDS, TutorThresholds.WRAP_UP_AT_SECONDS,
                    TutorThresholds.START_TIMEOUT_SECONDS, TutorThresholds.MAX_ATTEMPTS_PER_WORD,
                    TutorThresholds.MAX_SENTENCE_ATTEMPTS, TutorThresholds.IDLE_ASK_SECONDS,
                    TutorThresholds.IDLE_END_SECONDS, TutorThresholds.OFF_TOPIC_END_STREAK);
        }
    }

    /** Tiến độ một từ cho các chip trên giao diện. */
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record WordView(String word, String phoneme, double baseline, Double best, int attempts, String status,
            String tipVi) {
    }

    /** @param currentWord null khi Danh sách từ lỗi rỗng (câu đọc tốt) */
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record SessionResponse(UUID sessionId, String token, String model, Instant tokenExpiresAt,
            List<WordView> words, String currentWord, Limits limits) {
    }

    public record SwitchRequest(@NotBlank String word) {
    }

    /** @param instruction chuyển nguyên cho gia sư làm kết quả tool switch_word */
    public record SwitchResponse(WordView currentWord, int attemptsLeft, String instruction, List<WordView> words) {
    }

    /**
     * @param word        từ vừa chấm; null khi chấm cả câu
     * @param nextStep    retry_word, next_word, sentence hoặc end
     * @param nextWord    từ gia sư chuyển sang; null khi không đổi từ
     * @param outcome     có giá trị khi backend đã kết thúc phiên (đọc cả câu xong)
     * @param instruction chuyển nguyên cho gia sư làm kết quả tool request_retry
     */
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record AttemptResponse(int attemptNumber, String target, String word, double score, double accuracyScore,
            boolean passed, String wordStatus, String nextStep, String nextWord, String outcome, String instruction,
            List<WordView> words) {
    }

    /**
     * @param type    {@code topic} (cần topic) hoặc {@code end} (cần outcome)
     * @param topic   {@code on_topic} hoặc {@code off_topic}
     * @param outcome learner_exit, idle, timeout, connect_failed...
     */
    public record EventRequest(@NotBlank String type, String topic, String outcome) {
    }

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record EventResponse(Integer offTopicStreak, Boolean ended, String instruction, String outcome) {
    }

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record SessionSummary(UUID sessionId, Instant createdAt, Instant startedAt, Instant endedAt, String outcome,
            boolean charged, List<WordView> words) {
    }

    public static String wire(Enum<?> value) {
        return value == null ? null : value.name().toLowerCase(Locale.ROOT);
    }
}
