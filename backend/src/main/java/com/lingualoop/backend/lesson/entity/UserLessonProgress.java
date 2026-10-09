package com.lingualoop.backend.lesson.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "user_lesson_progress")
@IdClass(UserLessonProgressId.class)
@Getter
@Setter
public class UserLessonProgress {

    @Id
    @Column(name = "user_id")
    private UUID userId;

    @Id
    @Column(name = "lesson_id")
    private UUID lessonId;

    @Column(name = "started_at", nullable = false)
    private Instant startedAt = Instant.now();

    @Column(name = "last_activity_at", nullable = false)
    private Instant lastActivityAt = Instant.now();

    @Column(name = "completed_at")
    private Instant completedAt;
}
