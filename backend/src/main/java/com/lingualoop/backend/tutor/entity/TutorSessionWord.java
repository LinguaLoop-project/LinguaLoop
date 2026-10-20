package com.lingualoop.backend.tutor.entity;

import java.math.BigDecimal;
import java.math.RoundingMode;

import com.lingualoop.backend.tutor.WordStatus;

import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * Kết quả từng từ của một phiên: Từ luyện, số Lượt chấm, điểm trước và sau. {@code attempts} là của vòng luyện hiện
 * tại (quay lại từ thì về 0), {@code totalAttempts} đếm cả phiên.
 */
@Getter
@Entity
@Table(name = "tutor_session_words")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class TutorSessionWord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "session_id", nullable = false, updatable = false)
    private TutorSession session;

    @Column(name = "position", nullable = false, updatable = false)
    private Short position;

    /** Từ viết như trong câu. */
    @Column(name = "word", nullable = false, updatable = false)
    private String word;

    /** Từ đã chuẩn hóa ({@code Words.normalize}). */
    @Column(name = "word_key", nullable = false, updatable = false)
    private String wordKey;

    /** Âm đích cần sửa; null khi từ không có âm (Azure bỏ sót từ). */
    @Column(name = "focus_phoneme_id", updatable = false)
    private Short focusPhonemeId;

    @Column(name = "score_before", nullable = false, updatable = false, precision = 5, scale = 2)
    private BigDecimal scoreBefore;

    /** Điểm tốt nhất trong các Lượt chấm; null khi chưa chấm lần nào. */
    @Column(name = "score_after", precision = 5, scale = 2)
    private BigDecimal scoreAfter;

    @Column(name = "attempts", nullable = false)
    private Short attempts = 0;

    @Column(name = "total_attempts", nullable = false)
    private Short totalAttempts = 0;

    @Convert(converter = TutorConverters.Status.class)
    @Column(name = "status", nullable = false)
    private WordStatus status = WordStatus.PENDING;

    TutorSessionWord(TutorSession session, int position, String word, String wordKey, Short focusPhonemeId,
            double scoreBefore) {
        this.session = session;
        this.position = (short) position;
        this.word = word;
        this.wordKey = wordKey;
        this.focusPhonemeId = focusPhonemeId;
        this.scoreBefore = scale(scoreBefore);
    }

    public Double best() {
        return scoreAfter == null ? null : scoreAfter.doubleValue();
    }

    /** Ghi một Lượt chấm: tăng số lượt, giữ điểm tốt nhất, đặt trạng thái. */
    void recordAttempt(double score, WordStatus newStatus) {
        attempts = (short) (attempts + 1);
        totalAttempts = (short) (totalAttempts + 1);
        double best = scoreAfter == null ? score : Math.max(scoreAfter.doubleValue(), score);
        scoreAfter = scale(best);
        status = newStatus;
    }

    /** Quay lại từ này: được số Lượt chấm mới; từ đã đạt vẫn giữ trạng thái đạt. */
    void restart() {
        attempts = 0;
        if (status == WordStatus.NEEDS_PRACTICE) {
            status = WordStatus.PENDING;
        }
    }

    private static BigDecimal scale(double value) {
        return BigDecimal.valueOf(Math.max(0, Math.min(100, value))).setScale(2, RoundingMode.HALF_UP);
    }
}
