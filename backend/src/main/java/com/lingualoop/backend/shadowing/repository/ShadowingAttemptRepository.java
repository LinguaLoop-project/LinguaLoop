package com.lingualoop.backend.shadowing.repository;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

import com.lingualoop.backend.shadowing.dto.LatestAttemptResponse;

import lombok.RequiredArgsConstructor;

/** Ghi và đọc {@code sentence_attempts} (chế độ shadowing) cùng kết quả từng từ và từng âm vị. */
@Repository
@RequiredArgsConstructor
public class ShadowingAttemptRepository {

    private final JdbcClient jdbc;

    public record AttemptRow(UUID userId, UUID sentenceId, double score, double accuracy, double fluency,
            double completeness, Double prosody, int durationMs) {
    }

    public record WordRow(int position, String expectedWord, String actualWord, String outcome, double accuracy) {
    }

    public record PhonemeRow(int position, short phonemeId, double accuracy) {
    }

    public long insertAttempt(AttemptRow row) {
        return jdbc.sql("""
                INSERT INTO sentence_attempts (user_id, sentence_id, mode, provider, score, accuracy_score,
                                               fluency_score, completeness_score, prosody_score, duration_ms)
                VALUES (:user, :sentence, 'shadowing', 'azure', :score, :accuracy, :fluency, :completeness,
                        :prosody, :duration)
                RETURNING id""")
                .param("user", row.userId())
                .param("sentence", row.sentenceId())
                .param("score", scale(row.score()))
                .param("accuracy", scale(row.accuracy()))
                .param("fluency", scale(row.fluency()))
                .param("completeness", scale(row.completeness()))
                .param("prosody", row.prosody() == null ? null : scale(row.prosody()), java.sql.Types.NUMERIC)
                .param("duration", row.durationMs())
                .query(Long.class).single();
    }

    public long insertWord(long attemptId, WordRow word) {
        return jdbc.sql("""
                INSERT INTO sentence_attempt_words (attempt_id, position, expected_word, actual_word, outcome, accuracy_score)
                VALUES (:attempt, :position, :expected, :actual, :outcome, :accuracy)
                RETURNING id""")
                .param("attempt", attemptId)
                .param("position", word.position())
                .param("expected", word.expectedWord(), java.sql.Types.VARCHAR)
                .param("actual", word.actualWord(), java.sql.Types.VARCHAR)
                .param("outcome", word.outcome())
                .param("accuracy", scale(word.accuracy()))
                .query(Long.class).single();
    }

    public void insertPhonemes(long attemptWordId, List<PhonemeRow> phonemes) {
        for (PhonemeRow p : phonemes) {
            jdbc.sql("""
                    INSERT INTO sentence_attempt_phonemes (attempt_word_id, position, phoneme_id, accuracy_score)
                    VALUES (:word, :position, :phoneme, :accuracy)""")
                    .param("word", attemptWordId)
                    .param("position", p.position())
                    .param("phoneme", p.phonemeId())
                    .param("accuracy", scale(p.accuracy()))
                    .update();
        }
    }

    /** Bảng ký hiệu → id của {@code phonemes} (dữ liệu tham chiếu, ít đổi). */
    public Map<String, Short> phonemeIdsBySymbol() {
        Map<String, Short> ids = new HashMap<>();
        jdbc.sql("SELECT symbol, id FROM phonemes").query((rs, n) -> {
            ids.put(rs.getString("symbol"), rs.getShort("id"));
            return null;
        }).list();
        return ids;
    }

    /** Lượt mới nhất của từng câu đã đọc trong bài, theo thứ tự câu. */
    public List<LatestAttemptResponse> findLatestByLesson(UUID userId, UUID lessonId) {
        record Head(UUID sentenceId, long attemptId, double score, Instant attemptedAt, double best, int count) {
        }
        List<Head> heads = jdbc.sql("""
                SELECT DISTINCT ON (a.sentence_id) a.sentence_id, a.id, a.score, a.attempted_at,
                       st.best_score, st.attempt_count, s.sort_order
                FROM sentence_attempts a
                JOIN sentences s ON s.id = a.sentence_id
                JOIN v_user_sentence_stats st
                  ON st.user_id = a.user_id AND st.sentence_id = a.sentence_id AND st.mode = a.mode
                WHERE a.user_id = :user AND s.lesson_id = :lesson AND a.mode = 'shadowing'
                ORDER BY a.sentence_id, a.attempted_at DESC, a.id DESC""")
                .param("user", userId).param("lesson", lessonId)
                .query((rs, n) -> new Head(rs.getObject("sentence_id", UUID.class), rs.getLong("id"),
                        rs.getDouble("score"), rs.getObject("attempted_at", java.time.OffsetDateTime.class).toInstant(),
                        rs.getDouble("best_score"), rs.getInt("attempt_count")))
                .list();
        if (heads.isEmpty()) {
            return List.of();
        }

        Map<Long, List<LatestAttemptResponse.WordSummary>> wordsByAttempt = new LinkedHashMap<>();
        jdbc.sql("""
                SELECT attempt_id, position, expected_word, actual_word, outcome, accuracy_score
                FROM sentence_attempt_words WHERE attempt_id IN (:ids) ORDER BY attempt_id, position""")
                .param("ids", heads.stream().map(Head::attemptId).toList())
                .query((rs, n) -> {
                    String expected = rs.getString("expected_word");
                    wordsByAttempt.computeIfAbsent(rs.getLong("attempt_id"), k -> new ArrayList<>())
                            .add(new LatestAttemptResponse.WordSummary(rs.getInt("position"),
                                    expected != null ? expected : rs.getString("actual_word"),
                                    rs.getDouble("accuracy_score"), rs.getString("outcome")));
                    return null;
                }).list();

        Map<UUID, Integer> order = new HashMap<>();
        jdbc.sql("SELECT id, sort_order FROM sentences WHERE lesson_id = :lesson").param("lesson", lessonId)
                .query((rs, n) -> order.put(rs.getObject("id", UUID.class), rs.getInt("sort_order"))).list();

        return heads.stream()
                .sorted(java.util.Comparator.comparingInt(h -> order.getOrDefault(h.sentenceId(), 0)))
                .map(h -> new LatestAttemptResponse(h.sentenceId(), h.attemptId(), h.score(), h.attemptedAt(),
                        h.best(), h.count(), wordsByAttempt.getOrDefault(h.attemptId(), List.of())))
                .toList();
    }

    private static BigDecimal scale(double value) {
        return BigDecimal.valueOf(Math.max(0, Math.min(100, value))).setScale(2, RoundingMode.HALF_UP);
    }
}
