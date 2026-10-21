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

/** Điểm của một âm vị trong một từ; {@code phonemeId} trỏ tới bảng {@code phonemes}. */
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

    @Column(name = "phoneme_id", nullable = false, updatable = false)
    private Short phonemeId;

    @Column(name = "accuracy_score", nullable = false, precision = 5, scale = 2)
    private BigDecimal accuracyScore;

    AttemptPhoneme(AttemptWord word, int position, short phonemeId, BigDecimal accuracyScore) {
        this.word = word;
        this.position = (short) position;
        this.phonemeId = phonemeId;
        this.accuracyScore = accuracyScore;
    }
}
