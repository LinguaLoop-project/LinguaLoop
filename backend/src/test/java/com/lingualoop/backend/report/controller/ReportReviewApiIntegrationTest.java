package com.lingualoop.backend.report.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.contains;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.nullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.AbstractMockHttpServletRequestBuilder;

import com.lingualoop.backend.TestcontainersConfiguration;
import com.lingualoop.backend.report.ReportTestData;
import com.lingualoop.backend.security.Role;

/** Giáo viên và quản trị viên xem, sửa theo báo cáo, từ chối báo cáo (UC-XL-01 đến UC-XL-03) trên Postgres thật. */
@SpringBootTest
@AutoConfigureMockMvc
@Import({TestcontainersConfiguration.class, ReportTestData.class})
class ReportReviewApiIntegrationTest {

    private static final String TEACHER = "/api/v1/teacher/reports";
    private static final String ADMIN = "/api/v1/admin/reports";

    @Autowired private MockMvc mockMvc;
    @Autowired private ReportTestData data;
    @Autowired private JdbcTemplate jdbc;

    private UUID teacherA;
    private UUID admin;
    private UUID student;
    private UUID lesson;
    private UUID sentence;
    private final Instant now = Instant.now();

    @BeforeEach
    void setUp() {
        teacherA = data.user(Role.TEACHER, "Giáo viên A");
        admin = data.user(Role.ADMIN, "Quản trị");
        student = data.user(Role.STUDENT, "Nguyễn An");
        lesson = data.lesson(teacherA, "Airport Check-in", true);
        sentence = data.sentence(lesson, "Where is the gate?", "Cửa", 3);
    }

    private ResultActions as(UUID user, Role role, AbstractMockHttpServletRequestBuilder<?> request)
            throws Exception {
        return mockMvc.perform(request.header(HttpHeaders.AUTHORIZATION, "Bearer " + data.tokenFor(user, role)));
    }

    private ResultActions asTeacher(AbstractMockHttpServletRequestBuilder<?> request) throws Exception {
        return as(teacherA, Role.TEACHER, request);
    }

    private ResultActions asAdmin(AbstractMockHttpServletRequestBuilder<?> request) throws Exception {
        return as(admin, Role.ADMIN, request);
    }

    private static AbstractMockHttpServletRequestBuilder<?> action(String url, String note) {
        String body = note == null ? "{\"note\":null}" : "{\"note\":\"" + note + "\"}";
        return post(url).contentType(MediaType.APPLICATION_JSON).content(body);
    }

    private UUID report(String reason, String status, Duration ago) {
        return data.sentenceReport(student, sentence, reason, status, now.minus(ago));
    }

    // ---------------------------------------------------------------- danh sách và chi tiết (UC-XL-01)

    @Test
    void list_teacher_seesOnlyOwnContentErrorsWaitingTeacher_AC_XL_01() throws Exception {
        UUID second = data.sentence(lesson, "Gate three.", "Cổng ba", 6);
        report("translation", "waiting_teacher", Duration.ofHours(2));
        data.sentenceReport(student, second, "ipa", "waiting_teacher", now.minus(Duration.ofHours(1)));
        report("offensive", "waiting_admin", Duration.ofHours(1));
        report("ipa", "resolved", Duration.ofHours(1));
        UUID teacherB = data.user(Role.TEACHER, "Giáo viên B");
        data.sentenceReport(student, data.sentence(data.lesson(teacherB, "B", true), "B.", "B", 1), "ipa",
                "waiting_teacher", now);

        asTeacher(get(TEACHER))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalElements").value(2))
                .andExpect(jsonPath("$.data.items[*].reason").value(contains("ipa", "translation")))
                .andExpect(jsonPath("$.data.items[0].containerName").value("Airport Check-in"));
    }

    @Test
    void list_groupsDuplicatesAndDetailShowsSnapshot_AC_XL_07() throws Exception {
        UUID other1 = data.user(Role.STUDENT, "Trần Bình");
        UUID other2 = data.user(Role.STUDENT, "Lê Chi");
        data.sentenceReport(other1, sentence, "translation", "waiting_teacher", now.minus(Duration.ofHours(3)));
        data.sentenceReport(other2, sentence, "translation", "waiting_teacher", now.minus(Duration.ofHours(2)));
        UUID newest = report("translation", "waiting_teacher", Duration.ofHours(1));
        data.updateSentence(sentence, "text_vi", "Cửa ra");

        asTeacher(get(TEACHER))
                .andExpect(jsonPath("$.data.totalElements").value(1))
                .andExpect(jsonPath("$.data.items[0].reportCount").value(3))
                .andExpect(jsonPath("$.data.items[0].id").value(newest.toString()));
        asTeacher(get(TEACHER + "/" + newest))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.reports", hasSize(3)))
                .andExpect(jsonPath("$.data.snapshot.text_vi").value("Cửa"))
                .andExpect(jsonPath("$.data.current.text_vi").value("Cửa ra"))
                .andExpect(jsonPath("$.data.actions").value(contains("resolve", "reject")));
    }

    @Test
    void detail_onlyAdminSeesReporterNameAndStats_AC_XL_08_AC_XL_10() throws Exception {
        UUID id = report("translation", "waiting_teacher", Duration.ofHours(1));
        report("ipa", "rejected", Duration.ofDays(2));

        asTeacher(get(TEACHER + "/" + id))
                .andExpect(jsonPath("$.data.reports[0].reporterName").value(nullValue()))
                .andExpect(jsonPath("$.data.reports[0].reporterStats").value(nullValue()));
        asAdmin(get(ADMIN + "/" + id))
                .andExpect(jsonPath("$.data.reports[0].reporterName").value("Nguyễn An"))
                .andExpect(jsonPath("$.data.reports[0].reporterStats.submitted").value(2))
                .andExpect(jsonPath("$.data.reports[0].reporterStats.rejected").value(1));
    }

    @Test
    void list_adminFrequentRejectedFilter_needsFiveRejected_AC_XL_10() throws Exception {
        UUID spammer = data.user(Role.STUDENT, "Trần Bình");
        UUID mild = data.user(Role.STUDENT, "Lê Chi");
        for (int i = 0; i < 5; i++) {
            data.sentenceReport(spammer, data.sentence(lesson, "S" + i, "s", 10 + 3 * i), "other", "rejected",
                    now.minus(Duration.ofDays(1)));
        }
        for (int i = 0; i < 4; i++) {
            data.sentenceReport(mild, data.sentence(lesson, "M" + i, "m", 40 + 3 * i), "other", "rejected",
                    now.minus(Duration.ofDays(1)));
        }
        UUID open = data.sentenceReport(spammer, sentence, "ipa", "waiting_teacher", now);
        data.sentenceReport(mild, sentence, "translation", "waiting_teacher", now);

        asAdmin(get(ADMIN).param("frequentRejected", "true")
                .param("ownerId", teacherA.toString()))
                .andExpect(jsonPath("$.data.totalElements").value(1))
                .andExpect(jsonPath("$.data.items[0].id").value(open.toString()));
    }

    @Test
    void list_overdueAfterSevenDays_AC_XL_11() throws Exception {
        UUID old = report("translation", "waiting_teacher", Duration.ofDays(8));
        report("ipa", "waiting_teacher", Duration.ofDays(2));

        asTeacher(get(TEACHER).param("overdue", "true"))
                .andExpect(jsonPath("$.data.totalElements").value(1))
                .andExpect(jsonPath("$.data.items[0].id").value(old.toString()))
                .andExpect(jsonPath("$.data.items[0].overdue").value(true));
    }

    @Test
    void list_teacher_hidesReportsOfDeletedLesson_AC_XL_60() throws Exception {
        report("translation", "waiting_teacher", Duration.ofHours(1));
        data.deleteLesson(lesson);

        asTeacher(get(TEACHER)).andExpect(jsonPath("$.data.totalElements").value(0));
    }

    // ---------------------------------------------------------------- sửa theo báo cáo (UC-XL-02)

    @Test
    void resolve_afterFixingField_closesWholeGroup_AC_XL_17_AC_XL_18() throws Exception {
        UUID other = data.user(Role.STUDENT, "Trần Bình");
        UUID first = data.sentenceReport(other, sentence, "translation", "waiting_teacher",
                now.minus(Duration.ofHours(2)));
        UUID id = report("translation", "waiting_teacher", Duration.ofHours(1));
        data.updateSentence(sentence, "text_vi", "Cửa ra máy bay");

        asTeacher(action(TEACHER + "/" + id + "/resolve", "Đã sửa bản dịch")).andExpect(status().isNoContent());

        assertThat(data.status(id)).isEqualTo("resolved");
        assertThat(data.status(first)).isEqualTo("resolved");
        assertThat(data.note(first)).isEqualTo("Đã sửa bản dịch");
        assertThat(data.countAudit(id, "resolve")).isEqualTo(1);
    }

    // ---------------------------------------------------------------- áp dụng bản sửa đề xuất (UC-XL-02 nhánh 2a)

    private static AbstractMockHttpServletRequestBuilder<?> applyFix(UUID reportId, UUID entryId) {
        return post(TEACHER + "/" + reportId + "/apply-fix").contentType(MediaType.APPLICATION_JSON)
                .content("{\"entryId\":\"" + entryId + "\"}");
    }

    @Test
    void applyFix_sentence_writesChosenFieldAndAudits_thenResolves_AC_XL_19() throws Exception {
        UUID id = report("translation", "waiting_teacher", Duration.ofHours(1));
        data.setFix(id, "Cửa ra máy bay", "text_vi");

        asTeacher(applyFix(id, id)).andExpect(status().isNoContent());

        assertThat(data.field("sentences", sentence, "text_vi")).isEqualTo("Cửa ra máy bay");
        assertThat(data.countContentUpdates("sentence", sentence)).isEqualTo(1);
        assertThat(data.status(id)).isEqualTo("waiting_teacher");
        asTeacher(action(TEACHER + "/" + id + "/resolve", "Đã áp dụng bản sửa của học viên"))
                .andExpect(status().isNoContent());
        assertThat(data.status(id)).isEqualTo("resolved");
    }

    @Test
    void applyFix_choosesOneFixOfDuplicateGroup_AC_XL_20() throws Exception {
        UUID first = data.sentenceReport(data.user(Role.STUDENT, "B"), sentence, "ipa", "waiting_teacher",
                now.minus(Duration.ofHours(3)));
        UUID second = data.sentenceReport(data.user(Role.STUDENT, "C"), sentence, "ipa", "waiting_teacher",
                now.minus(Duration.ofHours(2)));
        UUID newest = report("ipa", "waiting_teacher", Duration.ofHours(1));
        data.setFix(first, "/ɡæt/", "ipa_us");
        data.setFix(second, "/ɡeɪt/", "ipa_us");
        data.setFix(newest, "/ɡeɪd/", "ipa_us");

        asTeacher(applyFix(newest, second)).andExpect(status().isNoContent());
        asTeacher(action(TEACHER + "/" + newest + "/resolve", "Đã sửa IPA")).andExpect(status().isNoContent());

        assertThat(data.field("sentences", sentence, "ipa_us")).isEqualTo("/ɡeɪt/");
        assertThat(List.of(data.status(first), data.status(second), data.status(newest)))
                .containsOnly("resolved");
    }

    @Test
    void applyFix_withoutFixOrOutsideGroupOrNotOwn_isRejected_AC_XL_21() throws Exception {
        UUID other = report("other", "waiting_teacher", Duration.ofHours(2));
        UUID translation = report("translation", "waiting_teacher", Duration.ofHours(1));
        data.setFix(translation, "Cửa ra", "text_vi");
        UUID teacherB = data.user(Role.TEACHER, "Giáo viên B");

        asTeacher(applyFix(other, other)).andExpect(status().isUnprocessableContent())
                .andExpect(jsonPath("$.code").value("REPORT_FIX_UNAVAILABLE"));
        asTeacher(applyFix(other, translation)).andExpect(status().isNotFound());
        as(teacherB, Role.TEACHER, applyFix(translation, translation)).andExpect(status().isForbidden());
        asTeacher(post(TEACHER + "/" + translation + "/apply-fix").contentType(MediaType.APPLICATION_JSON)
                .content("{}")).andExpect(status().isBadRequest());

        assertThat(data.field("sentences", sentence, "text_vi")).isEqualTo("Cửa");
    }

    @Test
    void detail_cardIncludesImageForPreview_sentenceHasNone_AC_XL_14() throws Exception {
        UUID deck = data.deck(teacherA, "TOEIC " + UUID.randomUUID(), true);
        UUID card = data.cardIn(data.group(deck), "hell");
        data.updateCard(card, "image_url", "vocab/cards/hell.png");
        UUID cardReport = data.cardReport(student, card, "other", "waiting_teacher", now);
        UUID sentenceReport = report("other", "waiting_teacher", Duration.ofHours(1));

        asTeacher(get(TEACHER + "/" + cardReport))
                .andExpect(jsonPath("$.data.imageUrl").value(containsString("hell.png")));
        asAdmin(get(ADMIN + "/" + cardReport))
                .andExpect(jsonPath("$.data.imageUrl").value(containsString("hell.png")));
        asTeacher(get(TEACHER + "/" + sentenceReport)).andExpect(jsonPath("$.data.imageUrl").value(nullValue()));
    }

    @Test
    void applyFix_card_validatesLikeCardEdit_AC_XL_19() throws Exception {
        UUID deck = data.deck(teacherA, "TOEIC " + UUID.randomUUID(), true);
        UUID group = data.group(deck);
        UUID card = data.cardIn(group, "sustain");
        data.cardIn(group, "maintain");
        UUID meaning = data.cardReport(student, card, "meaning", "waiting_teacher", now.minus(Duration.ofHours(3)));
        UUID word = data.cardReport(data.user(Role.STUDENT, "B"), card, "word", "waiting_teacher",
                now.minus(Duration.ofHours(2)));
        UUID phonetic = data.cardReport(data.user(Role.STUDENT, "C"), card, "phonetic", "waiting_teacher",
                now.minus(Duration.ofHours(1)));
        data.setFix(meaning, "duy trì", "meaning_vi");
        data.setFix(word, "Maintain", "word");
        data.setFix(phonetic, "/" + "a".repeat(120) + "/", "ipa_us");

        asTeacher(applyFix(word, word)).andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("VOCAB_CARD_WORD_TAKEN"));
        asTeacher(applyFix(phonetic, phonetic)).andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[0].field").value("ipaUs"));
        asTeacher(applyFix(meaning, meaning)).andExpect(status().isNoContent());

        assertThat(data.field("vocab_cards", card, "meaning_vi")).isEqualTo("duy trì");
        assertThat(data.field("vocab_cards", card, "word")).isEqualTo("sustain");
        assertThat(data.countContentUpdates("card", card)).isEqualTo(1);
    }

    @Test
    void resolve_onlyChosenFixFieldCounts_AC_XL_27() throws Exception {
        UUID id = report("ipa", "waiting_teacher", Duration.ofHours(1));
        data.setFix(id, "/ɡeɪt/", "ipa_us");

        data.updateSentence(sentence, "ipa_uk", "/ɡeɪt/");
        asTeacher(action(TEACHER + "/" + id + "/resolve", "Đã sửa"))
                .andExpect(status().isUnprocessableContent())
                .andExpect(jsonPath("$.details.fields").value(contains("ipa_us")));
        data.updateSentence(sentence, "ipa_us", "/ɡeɪt/");
        asTeacher(action(TEACHER + "/" + id + "/resolve", "Đã sửa")).andExpect(status().isNoContent());
    }

    @Test
    void resolve_withoutChangingField_isRejected_AC_XL_26_AC_XL_27() throws Exception {
        UUID id = report("ipa", "waiting_teacher", Duration.ofHours(1));

        asTeacher(action(TEACHER + "/" + id + "/resolve", "Đã sửa"))
                .andExpect(status().isUnprocessableContent())
                .andExpect(jsonPath("$.code").value("REPORT_NOT_FIXED"))
                .andExpect(jsonPath("$.details.fields").value(contains("ipa_us", "ipa_uk")));
        data.updateSentence(sentence, "text_vi", "Cổng");
        asTeacher(action(TEACHER + "/" + id + "/resolve", "Đã sửa")).andExpect(status().isUnprocessableContent());
        data.updateSentence(sentence, "ipa_us", "/ɡeɪt/");
        data.updateSentence(sentence, "ipa_us", "/ɡæt/");
        asTeacher(action(TEACHER + "/" + id + "/resolve", "Đã sửa")).andExpect(status().isUnprocessableContent());
        data.updateSentence(sentence, "ipa_us", "/ɡeɪt/");
        asTeacher(action(TEACHER + "/" + id + "/resolve", "Đã sửa")).andExpect(status().isNoContent());

        assertThat(data.status(id)).isEqualTo("resolved");
    }

    @Test
    void resolve_notOwnOrOffensive_isForbidden_AC_XL_23() throws Exception {
        UUID offensive = report("offensive", "waiting_admin", Duration.ofHours(1));
        UUID teacherB = data.user(Role.TEACHER, "Giáo viên B");
        UUID ofB = data.sentenceReport(student, data.sentence(data.lesson(teacherB, "B", true), "B.", "B", 1),
                "ipa", "waiting_teacher", now);

        asTeacher(action(TEACHER + "/" + offensive + "/resolve", "x")).andExpect(status().isForbidden());
        asTeacher(action(TEACHER + "/" + ofB + "/resolve", "x")).andExpect(status().isForbidden());
    }

    @Test
    void resolve_alreadyHandled_returnsConflict_AC_XL_24() throws Exception {
        UUID id = report("translation", "rejected", Duration.ofHours(1));

        asTeacher(action(TEACHER + "/" + id + "/resolve", "x"))
                .andExpect(status().isConflict()).andExpect(jsonPath("$.code").value("REPORT_ALREADY_HANDLED"));
    }

    @Test
    void resolve_noteMissingOrTooLong_isRejected_AC_XL_25() throws Exception {
        UUID id = report("translation", "waiting_teacher", Duration.ofHours(1));
        data.updateSentence(sentence, "text_vi", "Cửa ra máy bay");

        asTeacher(action(TEACHER + "/" + id + "/resolve", null))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.errors[0].field").value("note"));
        asTeacher(action(TEACHER + "/" + id + "/resolve", "x".repeat(501)))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.errors[0].code").value("Size"));
        asTeacher(action(TEACHER + "/" + id + "/resolve", "x".repeat(500))).andExpect(status().isNoContent());
    }

    // ---------------------------------------------------------------- từ chối (UC-XL-03)

    @Test
    void reject_byTeacher_closesWithReason_AC_XL_29() throws Exception {
        UUID id = report("translation", "waiting_teacher", Duration.ofHours(1));

        asTeacher(action(TEACHER + "/" + id + "/reject", "Đúng ngữ cảnh")).andExpect(status().isNoContent());

        assertThat(data.status(id)).isEqualTo("rejected");
        assertThat(data.note(id)).isEqualTo("Đúng ngữ cảnh");
    }

    @Test
    void reject_byAdmin_offensiveOrNoHandler_butNotActiveTeachersError_AC_XL_30_31_33() throws Exception {
        UUID offensive = report("offensive", "waiting_admin", Duration.ofHours(1));
        UUID ofActive = report("translation", "waiting_teacher", Duration.ofHours(1));
        UUID systemCard = data.card(data.deck(null, "Hệ thống " + UUID.randomUUID(), true), "sustain", "duy trì");
        UUID noHandler = data.cardReport(student, systemCard, "example", "waiting_teacher", now);

        asAdmin(action(ADMIN + "/" + offensive + "/reject", "Không phản cảm")).andExpect(status().isNoContent());
        asAdmin(action(ADMIN + "/" + noHandler + "/reject", "Câu ví dụ đúng")).andExpect(status().isNoContent());
        asAdmin(action(ADMIN + "/" + ofActive + "/reject", "x")).andExpect(status().isForbidden());

        assertThat(data.status(offensive)).isEqualTo("rejected");
        assertThat(data.status(noHandler)).isEqualTo("rejected");
        assertThat(data.status(ofActive)).isEqualTo("waiting_teacher");
    }

    @Test
    void list_adminFiltersByOwner_andListsOwners_AC_XL_09() throws Exception {
        UUID teacherB = data.user(Role.TEACHER, "Giáo viên B");
        UUID second = data.sentence(lesson, "Gate three.", "Cổng ba", 6);
        report("offensive", "waiting_admin", Duration.ofHours(2));
        data.sentenceReport(student, second, "offensive", "waiting_admin", now.minus(Duration.ofHours(1)));
        data.sentenceReport(student, data.sentence(data.lesson(teacherB, "B", true), "B.", "B", 1), "offensive",
                "waiting_admin", now);

        asAdmin(get(ADMIN).param("ownerId", teacherA.toString()))
                .andExpect(jsonPath("$.data.totalElements").value(2))
                .andExpect(jsonPath("$.data.items[*].ownerName").value(contains("Giáo viên A", "Giáo viên A")));
        asAdmin(get(ADMIN + "/owners"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[?(@.id == '" + teacherA + "')].name").value(contains("Giáo viên A")))
                .andExpect(jsonPath("$.data[?(@.id == '" + teacherB + "')].name").value(contains("Giáo viên B")));
        asTeacher(get(ADMIN + "/owners")).andExpect(status().isForbidden());
    }

    @Test
    void list_adminNoHandlerFilter_includesLockedTeachersReports_AC_XL_15() throws Exception {
        UUID id = report("translation", "waiting_teacher", Duration.ofHours(1));
        data.lock(teacherA);

        asAdmin(get(ADMIN).param("noHandler", "true").param("ownerId", teacherA.toString()))
                .andExpect(jsonPath("$.data.totalElements").value(1))
                .andExpect(jsonPath("$.data.items[0].id").value(id.toString()))
                .andExpect(jsonPath("$.data.items[0].noHandler").value(true));
        asAdmin(get(ADMIN + "/" + id)).andExpect(jsonPath("$.data.actions").value(contains("assign", "reject")));
    }

    @Test
    void rejectAll_byReporter_onlyThatStudentsOpenReports_AC_XL_32() throws Exception {
        UUID a = report("translation", "waiting_teacher", Duration.ofHours(2));
        UUID b = report("offensive", "waiting_admin", Duration.ofHours(1));
        UUID done = report("ipa", "resolved", Duration.ofHours(1));
        UUID otherStudent = data.user(Role.STUDENT, "Lê Chi");
        UUID theirs = data.sentenceReport(otherStudent, sentence, "translation", "waiting_teacher", now);

        asAdmin(action(ADMIN + "/reporters/" + student + "/reject", "Báo cáo rác"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.rejected").value(2));

        assertThat(data.status(a)).isEqualTo("rejected");
        assertThat(data.status(b)).isEqualTo("rejected");
        assertThat(data.status(done)).isEqualTo("resolved");
        assertThat(data.status(theirs)).isEqualTo("waiting_teacher");
        assertThat(data.countAudit(a, "reject")).isEqualTo(1);
    }

    // ---------------------------------------------------------------- báo kết quả cho người báo cáo (BR-TK-22)

    private List<Map<String, Object>> notices(UUID user) {
        return jdbc.queryForList("SELECT type, message, params::text AS params FROM notifications WHERE user_id = ?",
                user);
    }

    @Test
    void resolve_notifiesEveryReporterOfTheGroupOnce_AC_TK_73() throws Exception {
        UUID other = data.user(Role.STUDENT, "Trần Bình");
        data.sentenceReport(other, sentence, "translation", "waiting_teacher", now.minus(Duration.ofHours(2)));
        UUID id = report("translation", "waiting_teacher", Duration.ofHours(1));
        data.updateSentence(sentence, "text_vi", "Cửa ra máy bay");

        asTeacher(action(TEACHER + "/" + id + "/resolve", "Đã sửa bản dịch")).andExpect(status().isNoContent());

        assertThat(notices(student)).extracting(n -> n.get("type")).containsExactly("REPORT_RESOLVED");
        assertThat(notices(other)).extracting(n -> n.get("type")).containsExactly("REPORT_RESOLVED");
        assertThat(notices(teacherA)).isEmpty();
    }

    @Test
    void reject_notifiesTheReporterWithTheReason_AC_TK_73() throws Exception {
        UUID id = report("translation", "waiting_teacher", Duration.ofHours(1));

        asTeacher(action(TEACHER + "/" + id + "/reject", "Đúng ngữ cảnh")).andExpect(status().isNoContent());

        List<Map<String, Object>> list = notices(student);
        assertThat(list).hasSize(1);
        assertThat(list.get(0)).containsEntry("type", "REPORT_REJECTED");
        assertThat((String) list.get(0).get("message")).contains("Đúng ngữ cảnh");
        assertThat((String) list.get(0).get("params")).contains("Đúng ngữ cảnh");
    }

    @Test
    void failedResolve_doesNotNotifyTheReporter_AC_TK_73() throws Exception {
        UUID id = report("translation", "waiting_teacher", Duration.ofHours(1));

        asTeacher(action(TEACHER + "/" + id + "/resolve", "Chưa sửa gì")).andExpect(status().isUnprocessableContent());

        assertThat(notices(student)).isEmpty();
    }
}
