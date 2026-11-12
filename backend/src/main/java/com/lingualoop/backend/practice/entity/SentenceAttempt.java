package com.lingualoop.backend.practice.entity;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import com.lingualoop.backend.lesson.enums.PracticeMode;
import com.lingualoop.backend.practice.enums.AttemptOutcome;
import com.lingualoop.backend.practice.enums.DictationLevel;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

/**
 * Một lượt làm của một câu, dùng chung cho nghe chép và shadowing ({@code mode} phân biệt). Cột nào chỉ của một
 * chế độ thì để null ở chế độ kia.
 */
@Entity
@Table(name = "sentence_attempts")
@Getter
@Setter
public class SentenceAttempt {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false, updatable = false)
    private UUID userId;

    @Column(name = "sentence_id", nullable = false, updatable = false)
    private UUID sentenceId;

    @Enumerated(EnumType.STRING)
    @Column(name = "mode", nullable = false, updatable = false)
    private PracticeMode mode = PracticeMode.dictation;

    // Nghe chép
    @Enumerated(EnumType.STRING)
    @Column(name = "level")
    private DictationLevel level;

    @Column(name = "is_retry", nullable = false)
    private boolean retry;

    @Column(name = "gave_up", nullable = false)
    private boolean gaveUp;

    @Column(name = "submitted_text")
    private String submittedText;

    @JdbcTypeCode(SqlTypes.SMALLINT)
    @Column(name = "listen_count", nullable = false)
    private int listenCount;

    // Shadowing
    @Column(name = "accuracy_score", precision = 5, scale = 2)
    private BigDecimal accuracyScore;

    @Column(name = "fluency_score", precision = 5, scale = 2)
    private BigDecimal fluencyScore;

    @Column(name = "completeness_score", precision = 5, scale = 2)
    private BigDecimal completenessScore;

    @Column(name = "prosody_score", precision = 5, scale = 2)
    private BigDecimal prosodyScore;

    // Chung
    @Column(name = "total_score", nullable = false, precision = 5, scale = 2)
    private BigDecimal totalScore;

    /** Thời gian làm lượt này (ms); tổng thời gian học tính bằng sum, không lưu số cộng dồn. */
    @Column(name = "duration_ms")
    private Integer durationMs;

    /** Chống trùng khi gửi lại lượt nghe chép (uq_sa_request); null với shadowing. */
    @Column(name = "client_request_id", updatable = false)
    private UUID clientRequestId;

    /** Cột có mặc định {@code now()} ở DB nên không ghi từ ứng dụng. */
    @Column(name = "created_at", insertable = false, updatable = false)
    private Instant createdAt;

    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "attempt_id", nullable = false)
    @OrderBy("position")
    private List<SentenceAttemptWord> words = new ArrayList<>();

    public static SentenceAttempt azureShadowing(UUID userId, UUID sentenceId, double score, double accuracy,
            double fluency, double completeness, Double prosody) {
        SentenceAttempt attempt = new SentenceAttempt();
        attempt.userId = userId;
        attempt.sentenceId = sentenceId;
        attempt.mode = PracticeMode.shadowing;
        attempt.totalScore = scale(score);
        attempt.accuracyScore = scale(accuracy);
        attempt.fluencyScore = scale(fluency);
        attempt.completenessScore = scale(completeness);
        attempt.prosodyScore = prosody == null ? null : scale(prosody);
        return attempt;
    }

    public SentenceAttemptWord addWord(int position, String expectedWord, String actualWord, AttemptOutcome outcome,
            double accuracy) {
        SentenceAttemptWord word = new SentenceAttemptWord();
        word.setPosition(position);
        word.setExpectedWord(expectedWord);
        word.setActualWord(actualWord);
        word.setOutcome(outcome);
        word.setAccuracyScore(scale(accuracy));
        words.add(word);
        return word;
    }

    /** Điểm của Azure có thể lệch khỏi 0..100 vài phần nên kẹp lại để không vi phạm CHECK của DB. */
    static BigDecimal scale(double value) {
        return BigDecimal.valueOf(Math.max(0, Math.min(100, value))).setScale(2, RoundingMode.HALF_UP);
    }
}
