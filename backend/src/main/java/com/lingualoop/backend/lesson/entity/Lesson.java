package com.lingualoop.backend.lesson.entity;

import com.lingualoop.backend.common.entity.BaseEntity;
import com.lingualoop.backend.lesson.enums.CefrLevel;
import com.lingualoop.backend.lesson.enums.LessonStatus;
import com.lingualoop.backend.lesson.enums.SourceType;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "lessons")
@Getter
@Setter
public class Lesson extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "topic_id", nullable = false)
    private Topic topic;

    @Column(name = "slug", unique = true, nullable = false)
    private String slug;

    @Column(name = "title", nullable = false)
    private String title;

    @Column(name = "title_vi")
    private String titleVi;

    @Column(name = "description")
    private String description;

    @Column(name = "duration_sec")
    private Integer durationSec;

    @Enumerated(EnumType.STRING)
    @Column(name = "difficulty", columnDefinition = "cefr_code")
    private CefrLevel difficulty;

    @Enumerated(EnumType.STRING)
    @Column(name = "source_type", nullable = false)
    private SourceType sourceType = SourceType.youtube;

    @Column(name = "source_url")
    private String sourceUrl;

    @Column(name = "thumbnail_url")
    private String thumbnailUrl;

    @Column(name = "is_pro", nullable = false)
    private boolean pro = false;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private LessonStatus status = LessonStatus.APPROVED;

    @Column(name = "created_by")
    private UUID createdBy;

    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder = 0;

    @Column(name = "view_count", nullable = false)
    private Integer viewCount = 0;

    @Column(name = "deleted_at")
    private Instant deletedAt;
}
