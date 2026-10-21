package com.lingualoop.backend.practice.entity;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import com.lingualoop.backend.practice.enums.AttemptOutcome;
import com.lingualoop.backend.practice.enums.AttemptWordClass;

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
import lombok.Getter;
import lombok.Setter;

/** Kết quả một từ trong lượt, dùng chung cho nghe chép (nhóm từ) và shadowing (điểm từ và âm vị). */
@Entity
@Table(name = "sentence_attempt_words")
@Getter
@Setter
public class SentenceAttemptWord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Khoá ngoài do {@link SentenceAttempt#getWords()} ghi; ở đây chỉ để đọc. */
    @Column(name = "attempt_id", insertable = false, updatable = false)
    private Long attemptId;

    @JdbcTypeCode(SqlTypes.SMALLINT)
    @Column(name = "position", nullable = false)
    private Integer position;

    @Column(name = "expected_word")
    private String expectedWord;

    @Column(name = "actual_word")
    private String actualWord;

    @Enumerated(EnumType.STRING)
    @Column(name = "outcome", nullable = false)
    private AttemptOutcome outcome;

    // Nghe chép
    @Enumerated(EnumType.STRING)
    @Column(name = "expected_word_class")
    private AttemptWordClass expectedWordClass;

    // Shadowing
    @Column(name = "accuracy_score", precision = 5, scale = 2)
    private BigDecimal accuracyScore;

    @OneToMany(mappedBy = "word", cascade = CascadeType.ALL)
    @OrderBy("position")
    private List<AttemptPhoneme> phonemes = new ArrayList<>();

    public void addPhoneme(int position, Short phonemeId, String azureSymbol, Short targetPhonemeId,
            Short producedPhonemeId, Double producedScore, double accuracy) {
        phonemes.add(new AttemptPhoneme(this, position, phonemeId, azureSymbol, targetPhonemeId, producedPhonemeId,
                producedScore == null ? null : SentenceAttempt.scale(producedScore), SentenceAttempt.scale(accuracy)));
    }
}
