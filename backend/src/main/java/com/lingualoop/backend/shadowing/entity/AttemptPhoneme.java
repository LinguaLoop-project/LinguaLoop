package com.lingualoop.backend.shadowing.entity;

import java.math.BigDecimal;

import jakarta.persistence.Column;
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

/** Điểm của một âm vị trong một từ; các cột {@code *PhonemeId} trỏ tới bảng {@code phonemes} (ADR 0005). */
@Getter
@Entity
@Table(name = "sentence_attempt_phonemes")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class AttemptPhoneme {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "attempt_word_id", nullable = false, updatable = false)
    private AttemptWord word;

    @Column(name = "position", nullable = false, updatable = false)
    private Short position;

    /** Cách đọc Azure báo, đã chuyển sang bảng phonemes; null nếu chưa chuyển được (khi đó có {@code azureSymbol}). */
    @Column(name = "phoneme_id", updatable = false)
    private Short phonemeId;

    /** Ký hiệu gốc Azure trả; null ở dòng lưu trước khi có cột này. */
    @Column(name = "azure_symbol", updatable = false)
    private String azureSymbol;

    /** Âm đích ghép từ phiên âm của câu; null nếu không ghép được. */
    @Column(name = "target_phoneme_id", updatable = false)
    private Short targetPhonemeId;

    /** Ứng viên khác cao điểm nhất trong NBestPhonemes của Azure. */
    @Column(name = "produced_phoneme_id", updatable = false)
    private Short producedPhonemeId;

    @Column(name = "produced_score", updatable = false, precision = 5, scale = 2)
    private BigDecimal producedScore;

    @Column(name = "accuracy_score", nullable = false, precision = 5, scale = 2)
    private BigDecimal accuracyScore;

    AttemptPhoneme(AttemptWord word, int position, Short phonemeId, String azureSymbol, Short targetPhonemeId,
            Short producedPhonemeId, BigDecimal producedScore, BigDecimal accuracyScore) {
        this.word = word;
        this.position = (short) position;
        this.phonemeId = phonemeId;
        this.azureSymbol = azureSymbol;
        this.targetPhonemeId = targetPhonemeId;
        this.producedPhonemeId = producedPhonemeId;
        this.producedScore = producedScore;
        this.accuracyScore = accuracyScore;
    }
}
