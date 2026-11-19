package com.lingualoop.backend.report.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Duration;
import java.time.Instant;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.AbstractMockHttpServletRequestBuilder;

import com.lingualoop.backend.TestcontainersConfiguration;
import com.lingualoop.backend.report.ReportTestData;
import com.lingualoop.backend.report.service.ReportMaintenanceService;
import com.lingualoop.backend.security.Role;

/**
 * Gỡ nội dung do báo cáo (UC-XL-04), duyệt xuất bản lại (UC-XL-05, UC-BT-05 nhánh 2b đến 2d) và tự cập nhật báo cáo
 * (UC-XL-06) trên Postgres thật.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Import({TestcontainersConfiguration.class, ReportTestData.class})
class ReportModerationApiIntegrationTest {

    private static final String ADMIN = "/api/v1/admin/reports";
    private static final String REQUESTS = "/api/v1/admin/republish-requests";
    private static final String TEACHER_REQUESTS = "/api/v1/teacher/republish-requests";

    @Autowired private MockMvc mockMvc;
    @Autowired private ReportTestData data;
    @Autowired private ReportMaintenanceService maintenance;

    private UUID teacher;
    private UUID admin;
    private UUID student;
    private UUID deck;
    private UUID group;
    private UUID card;
    private final Instant now = Instant.now();

    @BeforeEach
    void setUp() {
        teacher = data.user(Role.TEACHER, "Giáo viên A");
        admin = data.user(Role.ADMIN, "Quản trị");
        student = data.user(Role.STUDENT, "Nguyễn An");
        deck = data.deck(teacher, "TOEIC " + UUID.randomUUID(), true);
        group = data.group(deck);
        card = data.cardIn(group, "sustain");
        data.cardIn(group, "maintain");
    }

    private ResultActions as(UUID user, Role role, AbstractMockHttpServletRequestBuilder<?> request)
            throws Exception {
        return mockMvc.perform(request.header(HttpHeaders.AUTHORIZATION, "Bearer " + data.tokenFor(user, role)));
    }

    private ResultActions asAdmin(AbstractMockHttpServletRequestBuilder<?> request) throws Exception {
        return as(admin, Role.ADMIN, request);
    }

    private ResultActions asTeacher(AbstractMockHttpServletRequestBuilder<?> request) throws Exception {
        return as(teacher, Role.TEACHER, request);
    }

    private static AbstractMockHttpServletRequestBuilder<?> json(AbstractMockHttpServletRequestBuilder<?> request,
            String body) {
        return request.contentType(MediaType.APPLICATION_JSON).content(body);
    }

    private ResultActions takedown(UUID reportId, String reason) throws Exception {
        return asAdmin(json(post(ADMIN + "/" + reportId + "/takedown"), "{\"note\":\"" + reason + "\"}"));
    }

    private ResultActions requestRepublish() throws Exception {
        return asTeacher(json(post(TEACHER_REQUESTS), "{\"targetType\":\"deck\",\"targetId\":\"" + deck + "\"}"));
    }

    // ---------------------------------------------------------------- gỡ nội dung (UC-XL-04)

    @Test
    void takedown_offensiveCard_unpublishesDeckAndClosesReport_AC_XL_38() throws Exception {
        UUID report = data.cardReport(student, card, "offensive", "waiting_admin", now);

        asAdmin(get(ADMIN + "/" + report)).andExpect(jsonPath("$.data.takedownCount").value(1));
        takedown(report, "Câu ví dụ phản cảm").andExpect(status().isNoContent());

        assertThat(data.deckStatus(deck)).isEqualTo("draft");
        assertThat(data.status(report)).isEqualTo("resolved");
        assertThat(data.note(report)).isEqualTo("Câu ví dụ phản cảm");
        assertThat(data.activeTakedowns("deck_id", deck)).isEqualTo(1);
        assertThat(data.takedownItems("deck_id", deck)).isEqualTo(1);
        assertThat(data.notifications(teacher)).anyMatch(m -> m.contains("Câu ví dụ phản cảm"));
    }

    @Test
    void takedown_lesson_closesAllOffensiveButKeepsErrorReports_AC_XL_39() throws Exception {
        UUID lesson = data.lesson(teacher, "Airport", true);
        UUID s3 = data.sentence(lesson, "S3", "s3", 3);
        UUID s8 = data.sentence(lesson, "S8", "s8", 8);
        UUID s5 = data.sentence(lesson, "S5", "s5", 13);
        UUID r3 = data.sentenceReport(student, s3, "offensive", "waiting_admin", now);
        UUID r8 = data.sentenceReport(student, s8, "offensive", "waiting_admin", now);
        UUID r5 = data.sentenceReport(student, s5, "ipa", "waiting_teacher", now);

        asAdmin(get(ADMIN + "/" + r3)).andExpect(jsonPath("$.data.takedownCount").value(2));
        takedown(r3, "Từ ngữ thô tục").andExpect(status().isNoContent());

        assertThat(data.lessonStatus(lesson)).isEqualTo("draft");
        assertThat(data.status(r3)).isEqualTo("resolved");
        assertThat(data.status(r8)).isEqualTo("resolved");
        assertThat(data.status(r5)).isEqualTo("waiting_teacher");
        assertThat(data.takedownItems("lesson_id", lesson)).isEqualTo(2);
    }

    @Test
    void takedown_contentErrorOnlyAfterThirtyDays_AC_XL_41_AC_XL_43() throws Exception {
        UUID old = data.cardReport(student, card, "meaning", "waiting_teacher", now.minus(Duration.ofDays(31)));
        UUID other = data.cardIn(group, "retain");
        UUID young = data.cardReport(student, other, "meaning", "waiting_teacher", now.minus(Duration.ofDays(10)));

        takedown(young, "x").andExpect(status().isForbidden());
        takedown(old, "Lỗi để quá 30 ngày").andExpect(status().isNoContent());

        assertThat(data.status(old)).isEqualTo("resolved");
        assertThat(data.status(young)).isEqualTo("waiting_teacher");
        assertThat(data.deckStatus(deck)).isEqualTo("draft");
    }

    @Test
    void takedown_draftDeck_onlyMarksAndBlocksTeacherPublish_AC_XL_42() throws Exception {
        data.setDeckStatus(deck, "draft");
        UUID report = data.cardReport(student, card, "offensive", "waiting_admin", now);

        takedown(report, "Phản cảm").andExpect(status().isNoContent());
        asTeacher(post("/api/v1/teacher/vocab/decks/" + deck + "/publish"))
                .andExpect(status().isConflict()).andExpect(jsonPath("$.code").value("REPORT_REVIEW_REQUIRED"));

        assertThat(data.activeTakedowns("deck_id", deck)).isEqualTo(1);
    }

    @Test
    void adminDeckDetail_takenDownDraftIsViewable_plainDraftIsNot_AC_BT_76() throws Exception {
        String decks = "/api/v1/admin/vocab/decks/";
        UUID plainDraft = data.deck(teacher, "Nháp " + UUID.randomUUID(), false);
        UUID report = data.cardReport(student, card, "offensive", "waiting_admin", now);
        takedown(report, "Phản cảm").andExpect(status().isNoContent());

        asAdmin(get(decks + deck)).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("draft"));
        asAdmin(get(decks + deck + "/groups/" + group + "/cards"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.totalElements").value(2));
        asAdmin(get(decks + plainDraft)).andExpect(status().isForbidden());
    }

    @Test
    void republish_replacingReportedImageCountsAsFixed_UC_BT_05_2c() throws Exception {
        data.updateCard(card, "image_url", "vocab/cards/old.png");
        UUID report = data.cardReport(student, card, "offensive", "waiting_admin", now);
        takedown(report, "Ảnh phản cảm").andExpect(status().isNoContent());

        String status = TEACHER_REQUESTS + "/status";
        asTeacher(get(status).param("targetType", "deck").param("targetId", deck.toString()))
                .andExpect(jsonPath("$.data.items[0].label").value("sustain"))
                .andExpect(jsonPath("$.data.items[0].fixed").value(false));
        requestRepublish().andExpect(status().isUnprocessableContent())
                .andExpect(jsonPath("$.details.items[0]").value("sustain"));
        data.updateCard(card, "image_url", "vocab/cards/new.png");
        asTeacher(get(status).param("targetType", "deck").param("targetId", deck.toString()))
                .andExpect(jsonPath("$.data.items[0].fixed").value(true));
        requestRepublish().andExpect(status().isCreated());
    }

    @Test
    void takedown_closedOrMissingReason_isRejected_AC_XL_43_AC_XL_46() throws Exception {
        UUID done = data.cardReport(student, card, "offensive", "rejected", now);
        UUID open = data.cardReport(data.user(Role.STUDENT, "B"), card, "offensive", "waiting_admin", now);

        takedown(done, "x").andExpect(status().isConflict());
        asAdmin(json(post(ADMIN + "/" + open + "/takedown"), "{\"note\":\"\"}"))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.errors[0].field").value("note"));
        assertThat(data.deckStatus(deck)).isEqualTo("published");
    }

    // ---------------------------------------------------------------- xuất bản lại (UC-XL-05, UC-BT-05 2b đến 2d)

    @Test
    void republish_requiresFixThenApprovalOnce_AC_BT_74_75_AC_XL_48() throws Exception {
        UUID report = data.cardReport(student, card, "offensive", "waiting_admin", now);
        takedown(report, "Phản cảm").andExpect(status().isNoContent());

        asTeacher(get(TEACHER_REQUESTS + "/status").param("targetType", "deck").param("targetId", deck.toString()))
                .andExpect(jsonPath("$.data.takenDown").value(true))
                .andExpect(jsonPath("$.data.reason").value("Phản cảm"));
        requestRepublish().andExpect(status().isUnprocessableContent())
                .andExpect(jsonPath("$.code").value("REPUBLISH_NOT_FIXED"))
                .andExpect(jsonPath("$.details.unchanged").value(1))
                .andExpect(jsonPath("$.details.items[0]").value("sustain"));
        data.updateCard(card, "example_en", "A clean example.");
        requestRepublish().andExpect(status().isCreated());
        requestRepublish().andExpect(status().isConflict()).andExpect(jsonPath("$.code").value("REPUBLISH_PENDING"));

        UUID request = data.pendingRequest("deck_id", deck);
        asAdmin(get(REQUESTS + "/" + request))
                .andExpect(jsonPath("$.data.changes", hasSize(1)))
                .andExpect(jsonPath("$.data.changes[0].snapshot.example_en").value("An example."))
                .andExpect(jsonPath("$.data.changes[0].current.example_en").value("A clean example."));
        asAdmin(post(REQUESTS + "/" + request + "/approve")).andExpect(status().isNoContent());

        assertThat(data.deckStatus(deck)).isEqualTo("published");
        assertThat(data.activeTakedowns("deck_id", deck)).isZero();
        assertThat(data.notifications(teacher)).anyMatch(m -> m.contains("đã được duyệt xuất bản lại"));
    }

    @Test
    void republish_deletedCardCountsAsFixed_andDetailShowsDeleted_AC_XL_49() throws Exception {
        UUID report = data.cardReport(student, card, "offensive", "waiting_admin", now);
        takedown(report, "Phản cảm").andExpect(status().isNoContent());

        asTeacher(delete("/api/v1/teacher/vocab/decks/" + deck + "/groups/" + group + "/cards/" + card))
                .andExpect(status().isNoContent());
        requestRepublish().andExpect(status().isCreated());

        asAdmin(get(REQUESTS + "/" + data.pendingRequest("deck_id", deck)))
                .andExpect(jsonPath("$.data.changes[0].deleted").value(true));
    }

    // ---------------------------------------------------------------- quản trị viên gỡ tay (UC-BT-06, BR-XL-13)

    private static final String ADMIN_DECKS = "/api/v1/admin/vocab/decks";
    private static final String TEACHER_DECKS = "/api/v1/teacher/vocab/decks";

    private ResultActions adminUnpublish(String reason) throws Exception {
        return asAdmin(json(post(ADMIN_DECKS + "/" + deck + "/unpublish"), "{\"reason\":\"" + reason + "\"}"));
    }

    private ResultActions requestRepublish(String note) throws Exception {
        return asTeacher(json(post(TEACHER_REQUESTS),
                "{\"targetType\":\"deck\",\"targetId\":\"" + deck + "\",\"note\":\"" + note + "\"}"));
    }

    @Test
    void manualUnpublish_closesOffensiveReportsAndKeepsErrorReports_AC_BT_79() throws Exception {
        UUID offensive = data.cardReport(student, card, "offensive", "waiting_admin", now);
        UUID retain = data.cardIn(group, "retain");
        UUID meaning = data.cardReport(student, retain, "meaning", "waiting_teacher", now);

        // Hộp gỡ tay nêu số báo cáo Phản cảm sẽ được đóng cùng (UC-BT-06 Bước 2); báo cáo lỗi nội dung không tính.
        asAdmin(get(ADMIN + "/offensive-count").param("targetType", "deck").param("targetId", deck.toString()))
                .andExpect(jsonPath("$.data.count").value(1));
        adminUnpublish("Chứa nội dung quảng cáo").andExpect(status().isNoContent());

        assertThat(data.deckStatus(deck)).isEqualTo("draft");
        assertThat(data.takedownSource("deck_id", deck)).isEqualTo("manual");
        assertThat(data.status(offensive)).isEqualTo("resolved");
        assertThat(data.note(offensive)).isEqualTo("Chứa nội dung quảng cáo");
        assertThat(data.status(meaning)).isEqualTo("waiting_teacher");
        assertThat(data.takedownItems("deck_id", deck)).isEqualTo(1);
        assertThat(data.notifications(teacher)).anyMatch(m -> m.contains("đã bị quản trị viên gỡ"));
        // Thẻ trong bản chụp chưa sửa thì chưa gửi được yêu cầu.
        requestRepublish().andExpect(status().isUnprocessableContent())
                .andExpect(jsonPath("$.code").value("REPUBLISH_NOT_FIXED"));
    }

    @Test
    void manualUnpublish_emptySnapshot_requiresNoteThenAdminSeesSourceAndNote_AC_BT_33_AC_BT_80_AC_XL_62()
            throws Exception {
        adminUnpublish("Chứa nội dung quảng cáo").andExpect(status().isNoContent());

        assertThat(data.takedownItems("deck_id", deck)).isZero();
        asTeacher(post(TEACHER_DECKS + "/" + deck + "/publish")).andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("REPORT_REVIEW_REQUIRED"));
        asTeacher(get(TEACHER_REQUESTS + "/status").param("targetType", "deck").param("targetId", deck.toString()))
                .andExpect(jsonPath("$.data.source").value("manual"))
                .andExpect(jsonPath("$.data.noteRequired").value(true))
                .andExpect(jsonPath("$.data.items", hasSize(0)));
        requestRepublish().andExpect(status().isBadRequest());
        requestRepublish("Đã bỏ link quảng cáo ở câu ví dụ của 3 thẻ").andExpect(status().isCreated());

        UUID request = data.pendingRequest("deck_id", deck);
        asAdmin(get(REQUESTS + "/" + request)).andExpect(jsonPath("$.data.item.source").value("manual"))
                .andExpect(jsonPath("$.data.item.note").value("Đã bỏ link quảng cáo ở câu ví dụ của 3 thẻ"))
                .andExpect(jsonPath("$.data.changes", hasSize(0)));
        asAdmin(post(REQUESTS + "/" + request + "/approve")).andExpect(status().isNoContent());
        assertThat(data.deckStatus(deck)).isEqualTo("published");
        assertThat(data.activeTakedowns("deck_id", deck)).isZero();
    }

    @Test
    void deleteDeck_cancelsPendingRequest_AC_BT_77() throws Exception {
        adminUnpublish("Chứa nội dung quảng cáo").andExpect(status().isNoContent());
        requestRepublish("Đã sửa").andExpect(status().isCreated());
        UUID request = data.pendingRequest("deck_id", deck);

        asTeacher(delete(TEACHER_DECKS + "/" + deck)).andExpect(status().isNoContent());

        assertThat(data.requestStatus(request)).isEqualTo("cancelled");
        assertThat(data.activeTakedowns("deck_id", deck)).isEqualTo(1);
        asAdmin(get(REQUESTS + "/" + request)).andExpect(jsonPath("$.data.status").value("cancelled"));
        asAdmin(post(REQUESTS + "/" + request + "/approve")).andExpect(status().isNotFound());
    }

    @Test
    void restoreDeck_keepsTakedownMark_AC_BT_78() throws Exception {
        adminUnpublish("Chứa nội dung quảng cáo").andExpect(status().isNoContent());
        asTeacher(delete(TEACHER_DECKS + "/" + deck)).andExpect(status().isNoContent());

        asTeacher(post(TEACHER_DECKS + "/" + deck + "/restore")).andExpect(status().isNoContent());

        assertThat(data.deckStatus(deck)).isEqualTo("draft");
        assertThat(data.activeTakedowns("deck_id", deck)).isEqualTo(1);
        asTeacher(post(TEACHER_DECKS + "/" + deck + "/publish")).andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("REPORT_REVIEW_REQUIRED"));
        requestRepublish("Đã sửa").andExpect(status().isCreated());
    }

    @Test
    void republish_rejectKeepsDraftAndAllowsResend_AC_XL_50() throws Exception {
        UUID report = data.cardReport(student, card, "offensive", "waiting_admin", now);
        takedown(report, "Phản cảm").andExpect(status().isNoContent());
        data.updateCard(card, "example_en", "Still rude.");
        requestRepublish().andExpect(status().isCreated());
        UUID request = data.pendingRequest("deck_id", deck);

        asAdmin(json(post(REQUESTS + "/" + request + "/reject"), "{\"note\":\"\"}"))
                .andExpect(status().isBadRequest());
        asAdmin(json(post(REQUESTS + "/" + request + "/reject"), "{\"note\":\"Vẫn còn từ thô tục\"}"))
                .andExpect(status().isNoContent());

        assertThat(data.deckStatus(deck)).isEqualTo("draft");
        asTeacher(get(TEACHER_REQUESTS + "/status").param("targetType", "deck").param("targetId", deck.toString()))
                .andExpect(jsonPath("$.data.pending").value(false))
                .andExpect(jsonPath("$.data.lastRejectReason").value("Vẫn còn từ thô tục"));
        requestRepublish().andExpect(status().isCreated());
    }

    @Test
    void approve_lessonMissingTranslation_isNotPublishable_AC_XL_53() throws Exception {
        UUID lesson = data.lesson(teacher, "Airport", true);
        UUID sentence = data.sentence(lesson, "Gate.", "Cổng", 3);
        UUID report = data.sentenceReport(student, sentence, "offensive", "waiting_admin", now);
        takedown(report, "Phản cảm").andExpect(status().isNoContent());
        data.updateSentence(sentence, "text_en", "Gate four.");
        asTeacher(json(post(TEACHER_REQUESTS), "{\"targetType\":\"lesson\",\"targetId\":\"" + lesson + "\"}"))
                .andExpect(status().isCreated());
        data.updateSentence(sentence, "text_vi", null);

        asAdmin(post(REQUESTS + "/" + data.pendingRequest("lesson_id", lesson) + "/approve"))
                .andExpect(status().isUnprocessableContent())
                .andExpect(jsonPath("$.code").value("LESSON_NOT_PUBLISHABLE"))
                .andExpect(jsonPath("$.details.missingTranslation[0]").value(1));
        assertThat(data.lessonStatus(lesson)).isEqualTo("draft");
    }

    // ---------------------------------------------------------------- bài học bị gỡ (UC-BH-06 đến 09, BR-XL-13)

    private static final String ADMIN_LESSONS = "/api/v1/admin/lessons";
    private static final String TEACHER_LESSONS = "/api/v1/teacher/lessons";

    /** Bài Đã xuất bản, đủ bản dịch: chỉ dấu "Bị quản trị viên gỡ" mới chặn được việc xuất bản lại. */
    private UUID publishableLesson() {
        UUID lesson = data.lesson(teacher, "Airport " + UUID.randomUUID(), true);
        data.sentence(lesson, "Gate.", "Cổng", 3);
        return lesson;
    }

    private ResultActions adminUnpublishLesson(UUID lesson, String reason) throws Exception {
        return asAdmin(json(post(ADMIN_LESSONS + "/" + lesson + "/unpublish"), "{\"reason\":\"" + reason + "\"}"));
    }

    private ResultActions publishLesson(UUID lesson) throws Exception {
        return asTeacher(post(TEACHER_LESSONS + "/" + lesson + "/publish"));
    }

    private ResultActions requestLessonRepublish(UUID lesson, String note) throws Exception {
        return asTeacher(json(post(TEACHER_REQUESTS),
                "{\"targetType\":\"lesson\",\"targetId\":\"" + lesson + "\",\"note\":\"" + note + "\"}"));
    }

    @Test
    @DisplayName("BUG-001 #64 · AC-BH-76: bài bị gỡ từ báo cáo Phản cảm không được xuất bản trực tiếp")
    void publish_lessonTakenDownByReport_requiresReview_AC_BH_76() throws Exception {
        UUID lesson = publishableLesson();
        UUID sentence = data.sentence(lesson, "Rude.", "Thô", 8);
        UUID report = data.sentenceReport(student, sentence, "offensive", "waiting_admin", now);
        takedown(report, "Phản cảm").andExpect(status().isNoContent());

        publishLesson(lesson).andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("REPORT_REVIEW_REQUIRED"));

        assertThat(data.lessonStatus(lesson)).isEqualTo("draft");
    }

    @Test
    @DisplayName("BUG-001 #64 · AC-BH-51, AC-BH-80: gỡ tay gắn dấu, báo giáo viên, đóng báo cáo Phản cảm")
    void adminUnpublishLesson_marksNotifiesAndClosesOffensive_AC_BH_51_AC_BH_80() throws Exception {
        UUID lesson = publishableLesson();
        UUID s3 = data.sentence(lesson, "S3", "s3", 8);
        UUID s5 = data.sentence(lesson, "S5", "s5", 13);
        UUID offensive = data.sentenceReport(student, s3, "offensive", "waiting_admin", now);
        UUID ipa = data.sentenceReport(student, s5, "ipa", "waiting_teacher", now);

        asAdmin(get(ADMIN + "/offensive-count").param("targetType", "lesson").param("targetId", lesson.toString()))
                .andExpect(jsonPath("$.data.count").value(1));
        adminUnpublishLesson(lesson, "Video vi phạm bản quyền").andExpect(status().isNoContent());

        assertThat(data.lessonStatus(lesson)).isEqualTo("draft");
        assertThat(data.activeTakedowns("lesson_id", lesson)).isEqualTo(1);
        assertThat(data.takedownSource("lesson_id", lesson)).isEqualTo("manual");
        assertThat(data.status(offensive)).isEqualTo("resolved");
        assertThat(data.note(offensive)).isEqualTo("Video vi phạm bản quyền");
        assertThat(data.status(ipa)).isEqualTo("waiting_teacher");
        assertThat(data.notifications(teacher)).anyMatch(m -> m.contains("Video vi phạm bản quyền"));
        publishLesson(lesson).andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("REPORT_REVIEW_REQUIRED"));
        assertThat(data.lessonStatus(lesson)).isEqualTo("draft");
    }

    @Test
    @DisplayName("BUG-001 #64 · AC-BH-78: xóa bài hủy yêu cầu xuất bản lại đang chờ, dấu giữ nguyên")
    void deleteLesson_cancelsPendingRequest_AC_BH_78() throws Exception {
        UUID lesson = publishableLesson();
        adminUnpublishLesson(lesson, "Tiêu đề chứa quảng cáo").andExpect(status().isNoContent());
        requestLessonRepublish(lesson, "Đã bỏ quảng cáo ở tiêu đề").andExpect(status().isCreated());
        UUID request = data.pendingRequest("lesson_id", lesson);

        asTeacher(delete(TEACHER_LESSONS + "/" + lesson)).andExpect(status().isNoContent());

        assertThat(data.requestStatus(request)).isEqualTo("cancelled");
        assertThat(data.activeTakedowns("lesson_id", lesson)).isEqualTo(1);
    }

    @Test
    @DisplayName("BUG-001 #64 · AC-BH-79: khôi phục bài bị gỡ vẫn giữ dấu và phải gửi duyệt")
    void restoreLesson_keepsTakedownMark_AC_BH_79() throws Exception {
        UUID lesson = publishableLesson();
        adminUnpublishLesson(lesson, "Tiêu đề chứa quảng cáo").andExpect(status().isNoContent());
        asTeacher(delete(TEACHER_LESSONS + "/" + lesson)).andExpect(status().isNoContent());

        asTeacher(post(TEACHER_LESSONS + "/" + lesson + "/restore")).andExpect(status().isNoContent());

        assertThat(data.lessonStatus(lesson)).isEqualTo("draft");
        assertThat(data.activeTakedowns("lesson_id", lesson)).isEqualTo(1);
        publishLesson(lesson).andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("REPORT_REVIEW_REQUIRED"));
        requestLessonRepublish(lesson, "Đã sửa").andExpect(status().isCreated());
    }

    @Test
    @DisplayName("BUG-001 #64 · BR-BH-02: quản trị viên xem được bài Nháp đang bị gỡ, không xem được Nháp thường")
    void adminLessonDetail_takenDownDraftIsViewable_plainDraftIsNot_AC_BH_10() throws Exception {
        UUID lesson = publishableLesson();
        UUID plainDraft = data.lesson(teacher, "Nháp " + UUID.randomUUID(), false);
        adminUnpublishLesson(lesson, "Tiêu đề chứa quảng cáo").andExpect(status().isNoContent());

        asAdmin(get(ADMIN_LESSONS + "/" + lesson)).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("draft"));
        asAdmin(get(ADMIN_LESSONS + "/" + plainDraft)).andExpect(status().isForbidden());
    }

    @Test
    void republish_otherTeachersDeck_isForbidden() throws Exception {
        UUID other = data.user(Role.TEACHER, "Giáo viên B");

        as(other, Role.TEACHER, json(post(TEACHER_REQUESTS), "{\"targetType\":\"deck\",\"targetId\":\"" + deck + "\"}"))
                .andExpect(status().isForbidden());
    }

    // ---------------------------------------------------------------- tự cập nhật báo cáo (UC-XL-06)

    @Test
    void maintenance_remindsOnceAfterSevenDays_AC_XL_55_56() {
        UUID old = data.cardReport(student, card, "meaning", "waiting_teacher", now.minus(Duration.ofDays(8)));
        UUID fresh = data.cardReport(student, data.cardIn(group, "retain"), "word", "waiting_teacher",
                now.minus(Duration.ofDays(2)));

        maintenance.runOnce();
        maintenance.runOnce();

        assertThat(data.reminded(old)).isTrue();
        assertThat(data.reminded(fresh)).isFalse();
        assertThat(data.notifications(teacher)).containsExactly("Bạn có 1 báo cáo chờ quá 7 ngày");
    }

    @Test
    void maintenance_noHandlerAndDeletedLesson_areNotNotified_AC_XL_57_58() {
        UUID systemDeck = data.deck(null, "Hệ thống " + UUID.randomUUID(), true);
        UUID systemReport = data.cardReport(student, data.cardIn(data.group(systemDeck), "x"), "word",
                "waiting_teacher", now.minus(Duration.ofDays(9)));
        UUID lesson = data.lesson(teacher, "Airport", true);
        UUID hidden = data.sentenceReport(student, data.sentence(lesson, "S", "s", 3), "ipa", "waiting_teacher",
                now.minus(Duration.ofDays(10)));
        data.deleteLesson(lesson);

        maintenance.runOnce();

        assertThat(data.reminded(systemReport)).isTrue();
        assertThat(data.reminded(hidden)).isFalse();
        assertThat(data.notifications(teacher)).isEmpty();
    }

    @Test
    void deletingCard_closesItsReportsInBothFlows_AC_XL_59() throws Exception {
        UUID error = data.cardReport(student, card, "example", "waiting_teacher", now);
        UUID offensive = data.cardReport(student, card, "offensive", "waiting_admin", now);

        asTeacher(delete("/api/v1/teacher/vocab/decks/" + deck + "/groups/" + group + "/cards/" + card))
                .andExpect(status().isNoContent());

        assertThat(data.status(error)).isEqualTo("resolved");
        assertThat(data.status(offensive)).isEqualTo("resolved");
        assertThat(data.note(error)).isEqualTo("Hệ thống đóng: nội dung đã bị xóa");
    }

    @Test
    void maintenance_closesReportsOfDeletedSentenceAndPurgedLesson_AC_XL_61() {
        UUID lesson = data.lesson(teacher, "Airport", true);
        UUID sentence = data.sentence(lesson, "S", "s", 3);
        UUID ofSentence = data.sentenceReport(student, sentence, "ipa", "waiting_teacher", now);
        data.deleteSentence(sentence);
        UUID purgedLesson = data.lesson(teacher, "Old", true);
        UUID purged = data.sentenceReport(student, data.sentence(purgedLesson, "P", "p", 3), "ipa",
                "waiting_teacher", now);
        data.deleteLessonAt(purgedLesson, now.minus(Duration.ofDays(31)));

        maintenance.runOnce();

        assertThat(data.status(ofSentence)).isEqualTo("resolved");
        assertThat(data.status(purged)).isEqualTo("resolved");
        assertThat(data.note(purged)).isEqualTo("Hệ thống đóng: nội dung đã bị xóa vĩnh viễn");
    }
}
