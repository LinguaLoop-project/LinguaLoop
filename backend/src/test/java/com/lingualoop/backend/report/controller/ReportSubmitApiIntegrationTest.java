package com.lingualoop.backend.report.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

import com.lingualoop.backend.TestcontainersConfiguration;
import com.lingualoop.backend.report.ReportTestData;
import com.lingualoop.backend.security.Role;

/** Học viên gửi báo cáo về câu hoặc thẻ (UC-BC-01) trên Postgres thật. */
@SpringBootTest
@AutoConfigureMockMvc
@Import({TestcontainersConfiguration.class, ReportTestData.class})
class ReportSubmitApiIntegrationTest {

    private static final String REPORTS = "/api/v1/reports";

    @Autowired private MockMvc mockMvc;
    @Autowired private ReportTestData data;

    private UUID student;
    private UUID sentence;
    private UUID card;

    @BeforeEach
    void setUp() {
        student = data.user(Role.STUDENT, "Nguyễn An");
        UUID teacher = data.user(Role.TEACHER, "Giáo viên A");
        sentence = data.sentence(data.lesson(teacher, "Airport", true), "Where is the gate?", "Cửa ra", 3);
        card = data.card(data.deck(teacher, "TOEIC 1", true), "environment", "tiền bạc");
    }

    private ResultActions submit(UUID user, Role role, String body) throws Exception {
        return mockMvc.perform(post(REPORTS).contentType(MediaType.APPLICATION_JSON).content(body)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + data.tokenFor(user, role)));
    }

    private ResultActions submit(String body) throws Exception {
        return submit(student, Role.STUDENT, body);
    }

    private static String body(String type, UUID target, String reason, String fix, String description) {
        return body(type, target, reason, fix, null, description);
    }

    private static String body(String type, UUID target, String reason, String fix, String fixField,
            String description) {
        return """
                {"targetType":"%s","targetId":"%s","reason":"%s","suggestedFix":%s,"fixField":%s,"description":%s}"""
                .formatted(type, target, reason, json(fix), json(fixField), json(description));
    }

    private static String json(String value) {
        return value == null ? "null" : "\"" + value + "\"";
    }

    @Test
    void submit_translationWithFix_savesWaitingTeacherWithSnapshot_AC_BC_01() throws Exception {
        submit(body("sentence", sentence, "translation", "Cửa ra máy bay", null)).andExpect(status().isCreated());

        assertThat(data.latestStatus(student)).isEqualTo("waiting_teacher");
        assertThat(data.latestSnapshot(student, "text_vi")).isEqualTo("Cửa ra");
        assertThat(data.latestSnapshot(student, "text_en")).isEqualTo("Where is the gate?");
    }

    @Test
    void submit_cardMeaningWithFix_savesWaitingTeacher_AC_BC_02() throws Exception {
        submit(body("card", card, "meaning", "môi trường", "meaning_vi", null)).andExpect(status().isCreated());

        assertThat(data.latestStatus(student)).isEqualTo("waiting_teacher");
        assertThat(data.latestSnapshot(student, "meaning_vi")).isEqualTo("tiền bạc");
        assertThat(data.latestFixField(student)).isEqualTo("meaning_vi");
    }

    @Test
    void submit_offensive_goesToAdmin_AC_BC_08() throws Exception {
        submit(body("sentence", sentence, "offensive", null, "Câu có từ ngữ xúc phạm")).andExpect(status().isCreated());

        assertThat(data.latestStatus(student)).isEqualTo("waiting_admin");
    }

    @Test
    void submit_missingOrInvalidFields_rejectsWithFieldError_AC_BC_03() throws Exception {
        submit(body("sentence", sentence, "", null, null))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.errors[0].field").value("reason"));
        submit(body("sentence", sentence, "ipa", "  ", "ipa_us", null))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.errors[0].field").value("suggestedFix"));
        // Lý do nhiều trường mà chưa chọn trường, hoặc chọn trường không thuộc lý do (BR-BC-11).
        submit(body("card", card, "meaning", "môi trường", null))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.errors[0].field").value("fixField"));
        submit(body("card", card, "meaning", "môi trường", "word", null))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.errors[0].code").value("Invalid"));
        submit(body("sentence", sentence, "subtitle_en", "Where is the gate?", null))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.errors[0].field").value("suggestedFix"))
                .andExpect(jsonPath("$.errors[0].code").value("Different"));
        for (String reason : new String[] {"timing", "offensive", "other"}) {
            submit(body("sentence", sentence, reason, null, null))
                    .andExpect(status().isBadRequest()).andExpect(jsonPath("$.errors[0].field").value("description"));
        }
        submit(body("sentence", sentence, "other", null, "x".repeat(501)))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.errors[0].field").value("description"));
        submit(body("card", card, "translation", "bản dịch", null))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.errors[0].field").value("reason"));

        assertThat(data.countReports(student)).isZero();
    }

    @Test
    void submit_sameReasonWhileOpen_rejectsDuplicate_AC_BC_04() throws Exception {
        submit(body("sentence", sentence, "subtitle_en", "Where is gate 3?", null)).andExpect(status().isCreated());

        submit(body("sentence", sentence, "subtitle_en", "Where is gate 4?", null))
                .andExpect(status().isConflict()).andExpect(jsonPath("$.code").value("REPORT_DUPLICATE"));
        submit(body("sentence", sentence, "translation", "Cổng", null)).andExpect(status().isCreated());
        UUID other = data.user(Role.STUDENT, "Lê Chi");
        submit(other, Role.STUDENT, body("sentence", sentence, "subtitle_en", "Where is gate 3?", null))
                .andExpect(status().isCreated());
    }

    @Test
    void submit_draftOrMissingContent_returnsNotFound_AC_BC_05() throws Exception {
        UUID teacher = data.user(Role.TEACHER, "Giáo viên B");
        UUID draft = data.sentence(data.lesson(teacher, "Nháp", false), "Hello there.", "Xin chào", 1);

        submit(body("sentence", draft, "translation", "Chào bạn", null))
                .andExpect(status().isNotFound()).andExpect(jsonPath("$.code").value("REPORT_TARGET_NOT_FOUND"));
        submit(body("card", UUID.randomUUID(), "word", "word", null))
                .andExpect(status().isNotFound()).andExpect(jsonPath("$.code").value("REPORT_TARGET_NOT_FOUND"));
    }

    @Test
    void submit_byTeacher_isForbidden() throws Exception {
        UUID teacher = data.user(Role.TEACHER, "Giáo viên C");

        submit(teacher, Role.TEACHER, body("sentence", sentence, "translation", "Cổng", null))
                .andExpect(status().isForbidden());
    }
}
