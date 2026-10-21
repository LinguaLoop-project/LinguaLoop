package com.lingualoop.backend.dictation.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import com.lingualoop.backend.TestcontainersConfiguration;
import com.lingualoop.backend.dictation.DictationTestData;

/** Nộp một lượt nghe chép rồi đọc trang bài: tiến độ và điểm từng câu phải khớp (nối dictation với lesson). */
@SpringBootTest
@AutoConfigureMockMvc
@Import({TestcontainersConfiguration.class, DictationTestData.class})
class DictationLessonProgressIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private DictationTestData data;
    @Autowired private JdbcTemplate jdbc;

    private final String tag = UUID.randomUUID().toString().substring(0, 8);

    private ResultActions as(UUID user, MockHttpServletRequestBuilder request) throws Exception {
        return mockMvc.perform(request.header(HttpHeaders.AUTHORIZATION, "Bearer " + data.tokenFor(user)));
    }

    private ResultActions submit(UUID user, UUID sentence, String json) throws Exception {
        return as(user, post("/api/v1/dictation/sentences/" + sentence + "/attempts")
                .contentType(MediaType.APPLICATION_JSON).content(json));
    }

    @Test
    void submit_updatesTheLessonProgressSeenOnTheLessonPage() throws Exception {
        UUID lesson = data.newLesson("lp-" + tag, false, "APPROVED", false);
        UUID first = data.newSentence(lesson, 0, "Could I get that to go?", "x");
        UUID second = data.newSentence(lesson, 1, "Oh wow", "x");
        UUID user = data.newUser();

        submit(user, first, "{\"level\":\"normal\",\"typedText\":\"could i\",\"durationMs\":4000}")
                .andExpect(status().isOk());
        as(user, get("/api/v1/lessons/lp-" + tag))
                .andExpect(jsonPath("$.data.progress.dictationPercent").value(50));
        assertThat(jdbc.queryForObject("SELECT total_time_sec FROM user_lesson_mode_progress WHERE user_id = ? "
                + "AND lesson_id = ?", Integer.class, user, lesson)).isEqualTo(4);

        submit(user, second, "{\"level\":\"hard\",\"gaveUp\":true}").andExpect(status().isOk());
        as(user, get("/api/v1/lessons/lp-" + tag))
                .andExpect(jsonPath("$.data.progress.dictationPercent").value(100));
        assertThat(jdbc.queryForObject("SELECT completed_at IS NOT NULL FROM user_lesson_mode_progress "
                + "WHERE user_id = ? AND lesson_id = ?", Boolean.class, user, lesson)).isTrue();
        as(user, get("/api/v1/lessons/lp-" + tag + "/sentences"))
                .andExpect(jsonPath("$.data[0].myBestScore.dictation").value(33));
    }
}
