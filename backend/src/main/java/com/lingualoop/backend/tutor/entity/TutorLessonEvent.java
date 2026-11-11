package com.lingualoop.backend.tutor.entity;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/** Học viên bật hoặc tắt Chế độ gia sư ở đầu bài hay giữa bài (số liệu hiệu quả làm sau). */
@Getter
@Entity
@Table(name = "tutor_lesson_events")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class TutorLessonEvent {

    /** Đúng các giá trị CHECK của DB. */
    public static final java.util.Set<String> EVENTS = java.util.Set.of("start_on", "start_off", "toggle_on", "toggle_off");

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false, updatable = false)
    private UUID userId;

    @Column(name = "lesson_id", nullable = false, updatable = false)
    private UUID lessonId;

    @Column(name = "event", nullable = false, updatable = false)
    private String event;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    public static TutorLessonEvent of(UUID userId, UUID lessonId, String event, Instant now) {
        if (!EVENTS.contains(event)) {
            throw new IllegalArgumentException("Unknown tutor lesson event: " + event);
        }
        TutorLessonEvent e = new TutorLessonEvent();
        e.userId = userId;
        e.lessonId = lessonId;
        e.event = event;
        e.createdAt = now;
        return e;
    }
}
