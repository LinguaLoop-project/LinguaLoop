package com.lingualoop.backend.lesson.entity;

import java.time.Instant;
import java.util.UUID;

import com.lingualoop.backend.common.entity.BaseEntity;
import com.lingualoop.backend.lesson.enums.CefrLevel;
import com.lingualoop.backend.lesson.enums.LessonStatus;

import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "lessons")
@Getter
@Setter
public class Lesson extends BaseEntity {

    /** Bài của thư viện chung. */
    public static final String KIND_LIBRARY = "library";

    /** Giáo viên chủ bài. */
    @Column(name = "owner_id", nullable = false)
    private UUID ownerId;

    /** {@code library} (thư viện chung) hoặc {@code personal} (bài riêng của học viên Pro). */
    @Column(name = "kind", nullable = false)
    private String kind = KIND_LIBRARY;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "topic_id")
    private Topic topic;

    @Column(name = "title", nullable = false)
    private String title;

    /** Mã video YouTube; liên kết và ảnh đại diện dựng lại từ mã này. */
    @Column(name = "youtube_id", nullable = false)
    private String youtubeId;

    @Column(name = "duration_sec", nullable = false)
    private Integer durationSec;

    @Enumerated(EnumType.STRING)
    @Column(name = "cefr_level", nullable = false)
    private CefrLevel cefrLevel;

    @Column(name = "is_pro", nullable = false)
    private boolean pro = false;

    @Convert(converter = LessonStatusConverter.class)
    @Column(name = "status", nullable = false)
    private LessonStatus status = LessonStatus.DRAFT;

    /** Lý do quản trị viên gỡ bài, hiện cho giáo viên. */
    @Column(name = "unpublish_reason")
    private String unpublishReason;

    @Column(name = "view_count", nullable = false)
    private Integer viewCount = 0;

    @Column(name = "deleted_at")
    private Instant deletedAt;
}
