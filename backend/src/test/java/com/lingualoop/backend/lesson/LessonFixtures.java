package com.lingualoop.backend.lesson;

import java.sql.Timestamp;
import java.time.Instant;
import java.util.UUID;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import lombok.RequiredArgsConstructor;

/**
 * Dữ liệu mẫu bài học, câu, chủ đề và gói Pro cho test của mọi feature; chèn bằng SQL vì các bảng thuộc feature
 * khác nhau. Chủ bài là tài khoản giáo viên hệ thống do migration seed.
 */
@Component
@RequiredArgsConstructor
public class LessonFixtures {

    /** Giáo viên hệ thống do V2__seed_reference_data tạo. */
    public static final UUID SYSTEM_TEACHER = UUID.fromString("00000000-0000-0000-0000-000000000002");

    private final JdbcTemplate jdbc;

    public UUID topic(String name) {
        return jdbc.queryForObject("INSERT INTO topics (name) VALUES (?) RETURNING id", UUID.class, name);
    }

    /** Bài thư viện; {@code status} là {@code draft} hoặc {@code published}. */
    public UUID lesson(UUID topicId, String title, boolean pro, String status, String cefrLevel, int viewCount,
            boolean deleted) {
        String youtubeId = UUID.randomUUID().toString().replace("-", "").substring(0, 11);
        return jdbc.queryForObject("INSERT INTO lessons (owner_id, kind, topic_id, title, youtube_id, duration_sec, "
                + "cefr_level, is_pro, status, view_count, deleted_at) "
                + "VALUES (?, 'library', ?, ?, ?, 600, ?, ?, ?, ?, ?) RETURNING id", UUID.class,
                SYSTEM_TEACHER, topicId, title, youtubeId, cefrLevel, pro, status, viewCount,
                deleted ? Timestamp.from(Instant.now()) : null);
    }

    public UUID publishedLesson(UUID topicId, String title) {
        return lesson(topicId, title, false, "published", "B1", 0, false);
    }

    /** Câu thứ {@code order} (từ 0): bắt đầu ở giây {@code order}, dài 0,9 giây. */
    public UUID sentence(UUID lessonId, int order, String textEn, String textVi) {
        return jdbc.queryForObject("INSERT INTO sentences (lesson_id, text_en, text_vi, start_ms, end_ms) "
                + "VALUES (?, ?, ?, ?, ?) RETURNING id", UUID.class, lessonId, textEn, textVi,
                order * 1000, order * 1000 + 900);
    }

    public UUID sentence(UUID lessonId, int order, String textEn) {
        return sentence(lessonId, order, textEn, null);
    }

    /** Cho người dùng một đơn Pro đã thanh toán, còn hạn 30 ngày. */
    public void grantPro(UUID userId) {
        insertPaidOrder(userId, "now() - interval '1 day'", "now() + interval '30 days'");
    }

    /** Cho người dùng một đơn Pro đã thanh toán nhưng đã hết hạn. */
    public void grantExpiredPro(UUID userId) {
        insertPaidOrder(userId, "now() - interval '31 days'", "now() - interval '1 day'");
    }

    private void insertPaidOrder(UUID userId, String startsAt, String endsAt) {
        jdbc.update("INSERT INTO pro_orders (user_id, plan_name, months, credits_per_month, amount_vnd, status, "
                + "expires_at, paid_at, starts_at, ends_at) "
                + "VALUES (?, 'Test', 1, 100, 0, 'paid', now(), now(), " + startsAt + ", " + endsAt + ")", userId);
    }
}
