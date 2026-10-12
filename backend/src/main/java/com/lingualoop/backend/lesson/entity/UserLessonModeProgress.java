package com.lingualoop.backend.lesson.entity;

import com.lingualoop.backend.lesson.enums.PracticeMode;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "user_lesson_mode_progress")
@IdClass(UserLessonModeProgressId.class)
@Getter
@Setter
public class UserLessonModeProgress {

    @Id
    @Column(name = "user_id")
    private UUID userId;

    @Id
    @Column(name = "lesson_id")
    private UUID lessonId;

    @Id
    @Enumerated(EnumType.STRING)
    @Column(name = "mode", columnDefinition = "practice_mode")
    private PracticeMode mode;

    @Column(name = "started_at", nullable = false)
    private Instant startedAt = Instant.now();

    @Column(name = "completed_at")
    private Instant completedAt;

    @Column(name = "total_time_sec", nullable = false)
    private Integer totalTimeSec = 0;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();
}
