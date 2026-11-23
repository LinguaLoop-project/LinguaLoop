package com.lingualoop.backend.aichat;

import java.sql.Timestamp;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
class LessonChatStatsQueryServiceImpl implements LessonChatStatsQueryService {

    private final JdbcClient jdbc;

    @Override
    public Set<LocalDate> activeDays(UUID userId) {
        return Set.copyOf(jdbc.sql("""
                SELECT DISTINCT (COALESCE(c.ended_at, c.started_at) AT TIME ZONE u.timezone)::date
                FROM ai_conversations c JOIN users u ON u.id = c.user_id
                WHERE c.user_id = :user AND c.status = 'completed'""")
                .param("user", userId)
                .query(LocalDate.class).list());
    }

    @Override
    public List<Session> sessions(UUID userId, Instant since, int limit) {
        return jdbc.sql("""
                SELECT c.id, c.lesson_id, l.title, c.mode, COALESCE(c.ended_at, c.started_at) AS ended,
                       (l.status = 'published' AND l.deleted_at IS NULL) AS available,
                       (SELECT count(*) FROM ai_conversation_messages m
                         WHERE m.conversation_id = c.id AND m.role = 'student') AS answered
                FROM ai_conversations c JOIN lessons l ON l.id = c.lesson_id
                WHERE c.user_id = :user AND c.status = 'completed' AND COALESCE(c.ended_at, c.started_at) >= :since
                ORDER BY ended DESC, c.id
                LIMIT :limit""")
                .param("user", userId).param("since", Timestamp.from(since)).param("limit", limit)
                .query((rs, n) -> new Session(rs.getObject("id", UUID.class), rs.getObject("lesson_id", UUID.class),
                        rs.getString("title"), rs.getBoolean("available"), rs.getString("mode"),
                        rs.getTimestamp("ended").toInstant(), rs.getInt("answered")))
                .list();
    }

    @Override
    public long countSessions(UUID userId, Instant since) {
        return jdbc.sql("""
                SELECT count(*) FROM ai_conversations
                WHERE user_id = :user AND status = 'completed' AND COALESCE(ended_at, started_at) >= :since""")
                .param("user", userId).param("since", Timestamp.from(since))
                .query(Long.class).single();
    }
}
