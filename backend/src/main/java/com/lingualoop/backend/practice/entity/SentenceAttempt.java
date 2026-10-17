package com.lingualoop.backend.practice.entity;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import com.lingualoop.backend.lesson.enums.PracticeMode;
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
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

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
    @Column(name = "mode", nullable = false, columnDefinition = "practice_mode")
    private PracticeMode mode = PracticeMode.dictation;

    @Enumerated(EnumType.STRING)
    @Column(name = "level")
    private DictationLevel level;

    @Column(name = "playback_rate", columnDefinition = "numeric(3,2)")
    private BigDecimal playbackRate;

    @Column(name = "is_retry", nullable = false)
    private boolean retry;

    @Column(name = "gave_up", nullable = false)
    private boolean gaveUp;

    @Column(name = "submitted_text")
    private String submittedText;

    @Column(name = "score", columnDefinition = "numeric(5,2)")
    private BigDecimal score;

    @Column(name = "duration_ms")
    private Integer durationMs;

    @Column(name = "replay_count", nullable = false)
    private int replayCount;

    @Column(name = "attempted_at", insertable = false, updatable = false)
    private Instant attemptedAt;

    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "attempt_id", nullable = false)
    private List<SentenceAttemptWord> words = new ArrayList<>();
}
