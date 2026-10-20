package com.lingualoop.backend.shadowing.entity;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/** Kết quả một từ trong lượt: từ mong đợi, từ nghe được, loại lỗi và điểm. */
@Getter
@Entity
@Table(name = "sentence_attempt_words")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class AttemptWord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "attempt_id", nullable = false, updatable = false)
    private SentenceAttempt attempt;

    @Column(name = "position", nullable = false, updatable = false)
    private Short position;

    @Column(name = "expected_word", updatable = false)
    private String expectedWord;

    @Column(name = "actual_word", updatable = false)
    private String actualWord;

    @Column(name = "outcome", nullable = false, updatable = false)
    private String outcome;

    @Column(name = "accuracy_score", precision = 5, scale = 2)
    private BigDecimal accuracyScore;

    @OneToMany(mappedBy = "word", cascade = CascadeType.ALL)
    @OrderBy("position")
    private List<AttemptPhoneme> phonemes = new ArrayList<>();

    AttemptWord(SentenceAttempt attempt, int position, String expectedWord, String actualWord, String outcome,
            BigDecimal accuracyScore) {
        this.attempt = attempt;
        this.position = (short) position;
        this.expectedWord = expectedWord;
        this.actualWord = actualWord;
        this.outcome = outcome;
        this.accuracyScore = accuracyScore;
    }

    public void addPhoneme(int position, Short phonemeId, String azureSymbol, Short targetPhonemeId,
            Short producedPhonemeId, Double producedScore, double accuracy) {
        phonemes.add(new AttemptPhoneme(this, position, phonemeId, azureSymbol, targetPhonemeId, producedPhonemeId,
                producedScore == null ? null : SentenceAttempt.scale(producedScore), SentenceAttempt.scale(accuracy)));
    }
}
