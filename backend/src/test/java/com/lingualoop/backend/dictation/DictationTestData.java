package com.lingualoop.backend.dictation;

import java.util.UUID;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import com.lingualoop.backend.lesson.LessonFixtures;
import com.lingualoop.backend.security.JwtTokenService;
import com.lingualoop.backend.security.Role;
import com.lingualoop.backend.user.service.UserAccountService;

import lombok.RequiredArgsConstructor;

/** Dữ liệu mẫu cho test API dictation; bài và câu thuộc feature lesson nên chèn bằng SQL. */
@Component
@RequiredArgsConstructor
public class DictationTestData {

    /** Id bài chứa câu, để test lọc theo bài. */
    public UUID lessonOf(UUID sentenceId) {
        return jdbc.queryForObject("SELECT lesson_id FROM sentences WHERE id = ?", UUID.class, sentenceId);
    }

    /** Thêm một {@code clientRequestId} mới vào thân yêu cầu nộp lượt (bắt buộc), trừ khi thân đã có sẵn. */
    public static String withRequestId(String json) {
        if (json.contains("clientRequestId")) {
            return json;
        }
        String field = "\"clientRequestId\":\"" + UUID.randomUUID() + "\"";
        String rest = json.trim().substring(1);
        return "{" + field + (rest.startsWith("}") ? "" : ",") + rest;
    }

    private final JdbcTemplate jdbc;
    private final UserAccountService userAccountService;
    private final JwtTokenService jwtTokenService;
    private final LessonFixtures lessonFixtures;

    public UUID newUser() {
        return userAccountService.createLocal("d-" + UUID.randomUUID() + "@x.com", "Dictation", "h").id();
    }

    public UUID newProUser() {
        UUID user = newUser();
        lessonFixtures.grantPro(user);
        return user;
    }

    public String tokenFor(UUID userId) {
        return jwtTokenService.issueAccessToken(userId, Role.STUDENT, UUID.randomUUID()).token();
    }

    /** Bài thư viện; {@code title} nhận biệt danh để test tự đặt; {@code status} "DRAFT" là nháp, giá trị khác là đã xuất bản. */
    public UUID newLesson(String title, boolean pro, String status, boolean deleted) {
        String tag = UUID.randomUUID().toString().substring(0, 8);
        UUID topic = lessonFixtures.topic("Topic " + tag);
        return lessonFixtures.lesson(topic, title + " " + tag, pro, status.equalsIgnoreCase("draft") ? "draft" : "published",
                "B1", 0, deleted);
    }

    public UUID newSentence(UUID lessonId, int order, String text, String textVi) {
        return lessonFixtures.sentence(lessonId, order, text, textVi);
    }
}
