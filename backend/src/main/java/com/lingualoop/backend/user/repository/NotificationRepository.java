package com.lingualoop.backend.user.repository;

import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

import com.lingualoop.backend.user.dto.response.NotificationsResponse;

import lombok.RequiredArgsConstructor;

/** Bảng {@code notifications}: thông báo trong ứng dụng của từng người dùng. */
@Repository
@RequiredArgsConstructor
public class NotificationRepository {

    private final JdbcClient jdbc;

    public void insert(UUID userId, String message) {
        jdbc.sql("INSERT INTO notifications (user_id, message) VALUES (:user, :message)")
                .param("user", userId).param("message", message)
                .update();
    }

    public List<NotificationsResponse.Item> findLatest(UUID userId, int limit) {
        return jdbc.sql("""
                SELECT id, message, read_at IS NOT NULL AS read, created_at
                FROM notifications WHERE user_id = :user
                ORDER BY created_at DESC, id DESC LIMIT :limit""")
                .param("user", userId).param("limit", limit)
                .query(NotificationsResponse.Item.class).list();
    }

    public long countUnread(UUID userId) {
        return jdbc.sql("SELECT count(*) FROM notifications WHERE user_id = :user AND read_at IS NULL")
                .param("user", userId).query(Long.class).single();
    }

    /** Đánh dấu đã đọc một thông báo của đúng người dùng; trả về false nếu không có (của người khác hoặc không tồn tại). */
    public boolean markRead(UUID userId, UUID id, Instant at) {
        return jdbc.sql("UPDATE notifications SET read_at = COALESCE(read_at, :at) WHERE id = :id AND user_id = :user")
                .param("at", Timestamp.from(at)).param("id", id).param("user", userId)
                .update() > 0;
    }

    public void markAllRead(UUID userId, Instant at) {
        jdbc.sql("UPDATE notifications SET read_at = :at WHERE user_id = :user AND read_at IS NULL")
                .param("at", Timestamp.from(at)).param("user", userId)
                .update();
    }
}
