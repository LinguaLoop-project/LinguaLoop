package com.lingualoop.backend.aichat;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.dao.DuplicateKeyException;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import com.lingualoop.backend.common.exception.BusinessException;
import com.lingualoop.backend.common.exception.ErrorCode;

import lombok.RequiredArgsConstructor;

/**
 * Đọc và ghi {@code ai_conversations} và {@code ai_conversation_messages}. Các thao tác ghi gồm nhiều câu lệnh chạy
 * trong một giao dịch ngắn; lời gọi Gemini luôn nằm ngoài giao dịch (xem {@link LessonChatServiceImpl}).
 */
@Repository
@RequiredArgsConstructor
class LessonChatRepository {

    /** Bài học làm nền: chỉ bài đã xuất bản, chưa xóa, và bài cá nhân chỉ của chủ bài (BR-AI-01). */
    record LessonRow(UUID id, String title, String cefrLevel, boolean pro) {
    }

    record ConversationRow(UUID id, UUID lessonId, String status, String summary, Instant startedAt, Instant endedAt) {
    }

    record MessageRow(long id, boolean tutor, String content, String feedback, String better, String hint,
            boolean voice, Instant createdAt) {
    }

    record HistoryRow(UUID id, String status, Instant startedAt, Instant endedAt, int answered, boolean hasSummary) {
    }

    private static final String CONVERSATION = """
            SELECT id, lesson_id, status, summary, started_at, ended_at FROM ai_conversations""";

    private final JdbcClient jdbc;

    Optional<LessonRow> findLesson(UUID userId, UUID lessonId) {
        return jdbc.sql("""
                SELECT id, title, cefr_level, is_pro FROM lessons
                WHERE id = :id AND status = 'published' AND deleted_at IS NULL
                  AND (kind = 'library' OR owner_id = :user)""")
                .param("id", lessonId).param("user", userId)
                .query((rs, n) -> new LessonRow(rs.getObject("id", UUID.class), rs.getString("title"),
                        rs.getString("cefr_level"), rs.getBoolean("is_pro")))
                .optional();
    }

    /** Lời thoại tiếng Anh của bài, mỗi câu một dòng theo thứ tự thời gian. */
    String transcript(UUID lessonId) {
        return String.join("\n", jdbc.sql("""
                SELECT text_en FROM sentences WHERE lesson_id = :id AND deleted_at IS NULL ORDER BY start_ms""")
                .param("id", lessonId).query(String.class).list());
    }

    Optional<ConversationRow> findOwned(UUID userId, UUID lessonId, UUID conversationId) {
        return jdbc.sql(CONVERSATION + " WHERE id = :id AND user_id = :user AND lesson_id = :lesson")
                .param("id", conversationId).param("user", userId).param("lesson", lessonId)
                .query(this::conversation).optional();
    }

    Optional<ConversationRow> findActive(UUID userId, UUID lessonId) {
        return jdbc.sql(CONVERSATION + " WHERE user_id = :user AND lesson_id = :lesson AND status = 'active'")
                .param("user", userId).param("lesson", lessonId).query(this::conversation).optional();
    }

    List<HistoryRow> history(UUID userId, UUID lessonId) {
        return jdbc.sql("""
                SELECT c.id, c.status, c.started_at, c.ended_at, c.summary IS NOT NULL AS has_summary,
                       (SELECT count(*) FROM ai_conversation_messages m
                         WHERE m.conversation_id = c.id AND m.role = 'student') AS answered
                FROM ai_conversations c
                WHERE c.user_id = :user AND c.lesson_id = :lesson
                ORDER BY c.started_at DESC""")
                .param("user", userId).param("lesson", lessonId)
                .query((rs, n) -> new HistoryRow(rs.getObject("id", UUID.class), rs.getString("status"),
                        instant(rs.getTimestamp("started_at")), instant(rs.getTimestamp("ended_at")),
                        rs.getInt("answered"), rs.getBoolean("has_summary")))
                .list();
    }

    List<MessageRow> messages(UUID conversationId) {
        return jdbc.sql("""
                SELECT id, role, content, feedback, better, hint, via_voice, created_at
                FROM ai_conversation_messages WHERE conversation_id = :id ORDER BY id""")
                .param("id", conversationId)
                .query((rs, n) -> new MessageRow(rs.getLong("id"), "tutor".equals(rs.getString("role")),
                        rs.getString("content"), rs.getString("feedback"), rs.getString("better"), rs.getString("hint"),
                        rs.getBoolean("via_voice"), instant(rs.getTimestamp("created_at"))))
                .list();
    }

    /**
     * Đóng cuộc trò chuyện đang mở của bài (nếu có, giữ nguyên trong lịch sử, BR-AI-05) rồi mở cuộc mới. Chỉ mục duy nhất
     * trên cuộc đang mở chặn hai yêu cầu bắt đầu chạy song song.
     */
    @Transactional
    UUID startFresh(UUID userId, UUID lessonId) {
        jdbc.sql("""
                UPDATE ai_conversations SET status = 'completed', ended_at = now()
                WHERE user_id = :user AND lesson_id = :lesson AND status = 'active'""")
                .param("user", userId).param("lesson", lessonId).update();
        try {
            return jdbc.sql("INSERT INTO ai_conversations (user_id, lesson_id) VALUES (:user, :lesson) RETURNING id")
                    .param("user", userId).param("lesson", lessonId).query(UUID.class).single();
        } catch (DuplicateKeyException duplicate) {
            throw new BusinessException(ErrorCode.AI_CHAT_TURN_CONFLICT);
        }
    }

    long addTutorMessage(UUID conversationId, String question) {
        return jdbc.sql("""
                INSERT INTO ai_conversation_messages (conversation_id, role, content)
                VALUES (:id, 'tutor', :text) RETURNING id""")
                .param("id", conversationId).param("text", question).query(Long.class).single();
    }

    /**
     * Lưu câu trả lời cùng nhận xét và (nếu còn) câu hỏi kế tiếp trong một giao dịch. Khóa dòng cuộc trò chuyện rồi kiểm
     * câu hỏi đang chờ vẫn đúng là {@code expectedLastId}: hai lần gửi cùng lúc thì chỉ một lần được lưu, lần kia nhận
     * {@code AI_CHAT_TURN_CONFLICT} và không bị trừ credit.
     */
    @Transactional
    void saveTurn(UUID conversationId, long expectedLastId, String answer, boolean voice, String feedback, String better,
            String nextQuestion) {
        requireOpenAt(conversationId, expectedLastId);
        jdbc.sql("""
                INSERT INTO ai_conversation_messages (conversation_id, role, content, feedback, better, via_voice)
                VALUES (:id, 'student', :text, :feedback, :better, :voice)""")
                .param("id", conversationId).param("text", answer).param("feedback", feedback)
                .param("better", better == null || better.isBlank() ? null : better).param("voice", voice).update();
        if (nextQuestion != null && !nextQuestion.isBlank()) {
            addTutorMessage(conversationId, nextQuestion);
        }
    }

    /** Lưu gợi ý của câu hỏi, chỉ khi câu hỏi đó vẫn là câu đang chờ; trả gợi ý đang lưu (có thể của yêu cầu đến trước). */
    @Transactional
    String saveHint(UUID conversationId, long questionId, String hint) {
        requireOpenAt(conversationId, questionId);
        jdbc.sql("UPDATE ai_conversation_messages SET hint = coalesce(hint, :hint) WHERE id = :id")
                .param("hint", hint).param("id", questionId).update();
        return jdbc.sql("SELECT hint FROM ai_conversation_messages WHERE id = :id")
                .param("id", questionId).query(String.class).single();
    }

    /** Đóng phiên đang mở; trả false nếu phiên đã được đóng bởi yêu cầu khác (để không trừ credit hai lần). */
    boolean complete(UUID conversationId, String summary) {
        return jdbc.sql("""
                UPDATE ai_conversations SET status = 'completed', summary = :summary, ended_at = now()
                WHERE id = :id AND status = 'active'""")
                .param("summary", summary).param("id", conversationId).update() > 0;
    }

    /** Không khởi tạo được câu hỏi đầu tiên: đóng với trạng thái lỗi (BR-AI-04). */
    void fail(UUID conversationId) {
        jdbc.sql("UPDATE ai_conversations SET status = 'error', ended_at = now() WHERE id = :id AND status = 'active'")
                .param("id", conversationId).update();
    }

    private void requireOpenAt(UUID conversationId, long expectedLastId) {
        String status = jdbc.sql("SELECT status FROM ai_conversations WHERE id = :id FOR UPDATE")
                .param("id", conversationId).query(String.class).optional().orElse("");
        if (!"active".equals(status)) {
            throw new BusinessException(ErrorCode.AI_CHAT_NOT_ACTIVE);
        }
        Long last = jdbc.sql("SELECT max(id) FROM ai_conversation_messages WHERE conversation_id = :id")
                .param("id", conversationId).query(Long.class).optional().orElse(null);
        if (last == null || last != expectedLastId) {
            throw new BusinessException(ErrorCode.AI_CHAT_TURN_CONFLICT);
        }
    }

    private ConversationRow conversation(ResultSet rs, int n) throws SQLException {
        return new ConversationRow(rs.getObject("id", UUID.class), rs.getObject("lesson_id", UUID.class),
                rs.getString("status"), rs.getString("summary"), instant(rs.getTimestamp("started_at")),
                instant(rs.getTimestamp("ended_at")));
    }

    private static Instant instant(Timestamp ts) {
        return ts == null ? null : ts.toInstant();
    }
}
