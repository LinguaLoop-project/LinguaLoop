package com.lingualoop.backend.practice.entity;

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
    private SentenceAttemptWord word;

    @Column(name = "position", nullable = false, updatable = false)
    private Short position;

    /** Ký hiệu gốc Azure trả về, giữ nguyên để hiển thị âm lạ và xử lý lại khi sửa bộ chuyển đổi. */
    @Column(name = "azure_symbol", updatable = false)
    private String azureSymbol;

    /** Âm đích ghép từ phiên âm của câu; null nếu không ghép được. */
    @Column(name = "target_phoneme_id", updatable = false)
    private Short targetPhonemeId;

    /** Âm Azure nhận ra, đã đổi sang bảng phonemes; null nếu chưa đổi được. */
    @Column(name = "heard_phoneme_id", updatable = false)
    private Short heardPhonemeId;

    /** Ứng viên khác cao điểm nhất trong NBestPhonemes của Azure. */
    @Column(name = "alt_phoneme_id", updatable = false)
    private Short altPhonemeId;

    @Column(name = "accuracy_score", nullable = false, precision = 5, scale = 2)
    private BigDecimal accuracyScore;

    AttemptPhoneme(SentenceAttemptWord word, int position, String azureSymbol, Short targetPhonemeId,
            Short heardPhonemeId, Short altPhonemeId, BigDecimal accuracyScore) {
        this.word = word;
        this.position = (short) position;
        this.azureSymbol = azureSymbol;
        this.targetPhonemeId = targetPhonemeId;
        this.heardPhonemeId = heardPhonemeId;
        this.altPhonemeId = altPhonemeId;
        this.accuracyScore = accuracyScore;
    }
}
