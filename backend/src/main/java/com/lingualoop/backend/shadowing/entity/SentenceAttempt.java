package com.lingualoop.backend.shadowing.entity;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import com.lingualoop.backend.lesson.enums.PracticeMode;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/** Một Lượt shadowing: điểm tổng và các điểm thành phần, kèm kết quả từng từ (và từng âm vị trong từ). */
@Getter
@Entity
@Table(name = "sentence_attempts")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class SentenceAttempt {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false, updatable = false)
    private UUID userId;

    @Column(name = "sentence_id", nullable = false, updatable = false)
    private UUID sentenceId;

    @Enumerated(EnumType.STRING)
    @Column(name = "mode", nullable = false, updatable = false, columnDefinition = "practice_mode")
    private PracticeMode mode;

    @Column(name = "provider", updatable = false)
    private String provider;

    @Column(name = "score", precision = 5, scale = 2)
    private BigDecimal score;

    @Column(name = "accuracy_score", precision = 5, scale = 2)
    private BigDecimal accuracyScore;

    @Column(name = "fluency_score", precision = 5, scale = 2)
    private BigDecimal fluencyScore;

    @Column(name = "completeness_score", precision = 5, scale = 2)
    private BigDecimal completenessScore;

    @Column(name = "prosody_score", precision = 5, scale = 2)
    private BigDecimal prosodyScore;

    @Column(name = "duration_ms")
    private Integer durationMs;

    /** Cột có mặc định {@code now()} ở DB nên không ghi từ ứng dụng. */
    @Column(name = "attempted_at", insertable = false, updatable = false)
    private Instant attemptedAt;

    @OneToMany(mappedBy = "attempt", cascade = CascadeType.ALL)
    @OrderBy("position")
    private List<AttemptWord> words = new ArrayList<>();

    public static SentenceAttempt azureShadowing(UUID userId, UUID sentenceId, double score, double accuracy,
            double fluency, double completeness, Double prosody, int durationMs) {
        SentenceAttempt attempt = new SentenceAttempt();
        attempt.userId = userId;
        attempt.sentenceId = sentenceId;
        attempt.mode = PracticeMode.shadowing;
        attempt.provider = "azure";
        attempt.score = scale(score);
        attempt.accuracyScore = scale(accuracy);
        attempt.fluencyScore = scale(fluency);
        attempt.completenessScore = scale(completeness);
        attempt.prosodyScore = prosody == null ? null : scale(prosody);
        attempt.durationMs = durationMs;
        return attempt;
    }

    public AttemptWord addWord(int position, String expectedWord, String actualWord, String outcome, double accuracy) {
        AttemptWord word = new AttemptWord(this, position, expectedWord, actualWord, outcome, scale(accuracy));
        words.add(word);
        return word;
    }

    /** Điểm của Azure có thể lệch khỏi 0..100 vài phần nên kẹp lại để không vi phạm CHECK của DB. */
    static BigDecimal scale(double value) {
        return BigDecimal.valueOf(Math.max(0, Math.min(100, value))).setScale(2, RoundingMode.HALF_UP);
    }
}
