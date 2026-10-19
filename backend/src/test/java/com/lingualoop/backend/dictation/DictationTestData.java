package com.lingualoop.backend.dictation;

import java.sql.Timestamp;
import java.time.Instant;
import java.util.UUID;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import com.lingualoop.backend.security.JwtTokenService;
import com.lingualoop.backend.security.Role;
import com.lingualoop.backend.user.service.UserAccountService;

import lombok.RequiredArgsConstructor;

/** Dữ liệu mẫu cho test API dictation; bài và câu thuộc feature lesson nên chèn bằng SQL. */
@Component
@RequiredArgsConstructor
public class DictationTestData {

    private final JdbcTemplate jdbc;
    private final UserAccountService userAccountService;
    private final JwtTokenService jwtTokenService;

    public UUID newUser() {
        return userAccountService.createLocal("d-" + UUID.randomUUID() + "@x.com", "Dictation", "h").id();
    }

    public UUID newProUser() {
        UUID user = newUser();
        jdbc.update("INSERT INTO user_subscriptions (user_id, status, expires_at) "
                + "VALUES (?, 'active', now() + interval '10 days')", user);
        return user;
    }

    public String tokenFor(UUID userId) {
        return jwtTokenService.issueAccessToken(userId, Role.STUDENT, UUID.randomUUID()).token();
    }

    public UUID newLesson(String slug, boolean pro, String status, boolean deleted) {
        String tag = UUID.randomUUID().toString().substring(0, 8);
        UUID topic = jdbc.queryForObject("INSERT INTO topics (slug, name) VALUES (?, ?) RETURNING id", UUID.class,
                "t-" + tag, "Topic " + tag);
        return jdbc.queryForObject("INSERT INTO lessons (topic_id, slug, title, title_vi, difficulty, source_type, "
                + "source_url, duration_sec, is_pro, status, deleted_at) "
                + "VALUES (?, ?, ?, ?, 'B1'::cefr_code, 'youtube', ?, 120, ?, ?, ?) RETURNING id", UUID.class,
                topic, slug, "Title " + slug, "Tiêu đề " + slug, "https://youtu.be/" + tag, pro, status,
                deleted ? Timestamp.from(Instant.now()) : null);
    }

    public UUID newSentence(UUID lessonId, int order, String text, String textVi) {
        return jdbc.queryForObject("INSERT INTO sentences (lesson_id, sort_order, text, text_vi, start_ms, end_ms) "
                + "VALUES (?, ?, ?, ?, ?, ?) RETURNING id", UUID.class, lessonId, order, text, textVi,
                order * 1000, order * 1000 + 900);
    }
}
