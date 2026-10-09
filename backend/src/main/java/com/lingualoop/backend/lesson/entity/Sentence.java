package com.lingualoop.backend.lesson.entity;

import com.lingualoop.backend.common.entity.BaseEntity;
import com.lingualoop.backend.lesson.enums.CefrLevel;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "sentences")
@Getter
@Setter
public class Sentence extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lesson_id", nullable = false)
    private Lesson lesson;

    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder;

    @Column(name = "text", nullable = false)
    private String text;

    @Column(name = "text_vi")
    private String textVi;

    @Column(name = "ipa")
    private String ipa;

    @Column(name = "start_ms", nullable = false)
    private Integer startMs;

    @Column(name = "end_ms", nullable = false)
    private Integer endMs;

    @Enumerated(EnumType.STRING)
    @Column(name = "cefr_level")
    private CefrLevel cefrLevel;

    @Column(name = "cefr_source", nullable = false)
    private String cefrSource = "editor_guess";

    @Enumerated(EnumType.STRING)
    @Column(name = "cefr_suggested_by_ai")
    private CefrLevel cefrSuggestedByAi;

    @Column(name = "ai_model")
    private String aiModel;

    @Column(name = "ai_confidence")
    private Double aiConfidence;

    @Column(name = "reviewed_by")
    private UUID reviewedBy;

    @Column(name = "reviewed_at")
    private Instant reviewedAt;
}
