package com.lingualoop.backend.user.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
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
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import com.lingualoop.backend.TestcontainersConfiguration;
import com.lingualoop.backend.security.Role;
import com.lingualoop.backend.user.AdminUserTestData;

/**
 * API quản trị tài khoản (UC-QT-01 đến 04). Danh sách tài khoản gồm tài khoản của mọi test chạy trên cùng cơ sở dữ
 * liệu, nên test danh sách đặt tên với tiền tố {@link #base} và tìm theo tiền tố đó.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Import({TestcontainersConfiguration.class, AdminUserTestData.class})
class AdminUserApiIntegrationTest {

    private static final String USERS = "/api/v1/admin/users";

    @Autowired private MockMvc mockMvc;
    @Autowired private AdminUserTestData data;

    private final String base = "qt" + UUID.randomUUID().toString().replace("-", "").substring(0, 8);
    private UUID admin;

    @BeforeEach
    void setUp() {
        admin = data.admin();
    }

    private ResultActions asAdmin(MockHttpServletRequestBuilder request) throws Exception {
        return mockMvc.perform(request.header(HttpHeaders.AUTHORIZATION, data.bearer(admin, Role.ADMIN)));
    }

    private ResultActions lock(UUID userId, String reason) throws Exception {
        return asAdmin(post(USERS + "/" + userId + "/lock").contentType(MediaType.APPLICATION_JSON)
                .content("{\"reason\":\"" + reason + "\"}"));
    }

    private ResultActions changeRole(UUID userId, String role) throws Exception {
        return asAdmin(post(USERS + "/" + userId + "/role").contentType(MediaType.APPLICATION_JSON)
                .content("{\"role\":\"" + role + "\"}"));
    }

    // ---------------------------------------------------------------- UC-QT-01

    @Test
    void list_returnsNewestFirstWithPlanOnlyForStudents_AC_QT_01() throws Exception {
        Instant now = Instant.now();
        UUID oldStudent = data.user(Role.STUDENT, base + " Học viên cũ", now.minus(3, ChronoUnit.DAYS));
        UUID teacher = data.user(Role.TEACHER, base + " Giáo viên", now.minus(2, ChronoUnit.DAYS));
        UUID newStudent = data.user(Role.STUDENT, base + " Học viên mới", now.minus(1, ChronoUnit.DAYS));
        data.grantPro(newStudent, now.plus(30, ChronoUnit.DAYS));

        asAdmin(get(USERS).param("q", base)).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.size").value(20))
                .andExpect(jsonPath("$.data.totalElements").value(3))
                .andExpect(jsonPath("$.data.items[0].id").value(newStudent.toString()))
                .andExpect(jsonPath("$.data.items[0].plan").value("pro"))
                .andExpect(jsonPath("$.data.items[0].locked").value(false))
                .andExpect(jsonPath("$.data.items[0].email").exists())
                .andExpect(jsonPath("$.data.items[0].createdAt").exists())
                .andExpect(jsonPath("$.data.items[1].id").value(teacher.toString()))
                .andExpect(jsonPath("$.data.items[1].role").value("teacher"))
                .andExpect(jsonPath("$.data.items[1].plan").doesNotExist())
                .andExpect(jsonPath("$.data.items[2].id").value(oldStudent.toString()))
                .andExpect(jsonPath("$.data.items[2].plan").value("free"));
    }

    @Test
    void list_filtersByRolePlanStatusAndKeyword_AC_QT_02() throws Exception {
        UUID proActive = data.user(Role.STUDENT, base + " minh Pro");
        data.grantPro(proActive, Instant.now().plus(10, ChronoUnit.DAYS));
        UUID freeLocked = data.user(Role.STUDENT, base + " minh Free");
        data.lock(freeLocked);
        data.user(Role.TEACHER, base + " minh Giáo viên");

        asAdmin(get(USERS).param("q", base + " minh").param("role", "student").param("plan", "pro")
                .param("status", "active")).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalElements").value(1))
                .andExpect(jsonPath("$.data.items[0].id").value(proActive.toString()));
        asAdmin(get(USERS).param("q", base).param("status", "locked")).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalElements").value(1))
                .andExpect(jsonPath("$.data.items[0].id").value(freeLocked.toString()));
    }

    @Test
    void detail_teacher_showsContentCountsAndCredit_AC_QT_03() throws Exception {
        UUID teacher = data.teacher(base + " Lê Thanh");
        for (int i = 0; i < 3; i++) {
            data.lesson(teacher, base + " bài " + i, true);
        }
        data.lesson(teacher, base + " bài nháp", false);
        data.deleteLesson(data.lesson(teacher, base + " bài đã xóa", true));
        data.deck(teacher, base + " bộ 1", true);
        data.deck(teacher, base + " bộ 2", false);
        data.setCredits(teacher, 1200);

        asAdmin(get(USERS + "/" + teacher)).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.role").value("teacher"))
                .andExpect(jsonPath("$.data.locked").value(false))
                .andExpect(jsonPath("$.data.content.publishedLessons").value(3))
                .andExpect(jsonPath("$.data.content.draftLessons").value(1))
                .andExpect(jsonPath("$.data.content.publishedDecks").value(1))
                .andExpect(jsonPath("$.data.content.draftDecks").value(1))
                .andExpect(jsonPath("$.data.creditBalance").value(1200))
                .andExpect(jsonPath("$.data.plan").doesNotExist())
                .andExpect(jsonPath("$.data.recentActivities").isArray());
    }

    @Test
    void list_noMatch_returnsEmpty_AC_QT_04() throws Exception {
        asAdmin(get(USERS).param("q", "zzz" + base)).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.items").isEmpty())
                .andExpect(jsonPath("$.data.totalElements").value(0));
    }

    @Test
    void list_nonAdmin_forbidden_BR_QT_01() throws Exception {
        UUID teacher = data.teacher(base + " Giáo viên");
        mockMvc.perform(get(USERS).header(HttpHeaders.AUTHORIZATION, data.bearer(teacher, Role.TEACHER)))
                .andExpect(status().isForbidden());
    }

    // ---------------------------------------------------------------- UC-QT-02

    @Test
    void lock_student_endsSessionsAndRecordsReason_AC_QT_05() throws Exception {
        UUID student = data.user(Role.STUDENT, base + " Phạm Đức");
        UUID session = data.session(student);
        String studentToken = data.bearer(student, Role.STUDENT);
        mockMvc.perform(get("/api/v1/users/me").header(HttpHeaders.AUTHORIZATION, studentToken))
                .andExpect(status().isOk());

        lock(student, "Nhiều lần đăng bình luận spam").andExpect(status().isOk())
                .andExpect(jsonPath("$.data.locked").value(true))
                .andExpect(jsonPath("$.data.lockedReason").value("Nhiều lần đăng bình luận spam"))
                .andExpect(jsonPath("$.data.lockedAt").exists());

        assertThat(data.sessionRevoked(session)).isTrue();
        mockMvc.perform(get("/api/v1/users/me").header(HttpHeaders.AUTHORIZATION, studentToken))
                .andExpect(status().isUnauthorized());
        assertThat(data.auditNote(student, "lock")).isEqualTo("Nhiều lần đăng bình luận spam");
    }

    @Test
    void lock_teacherWithContent_keepsPublishedContentAndReports_AC_QT_06() throws Exception {
        UUID teacher = data.teacher(base + " Lê Thanh");
        UUID lesson = data.lesson(teacher, base + " bài", true);
        UUID deck = data.deck(teacher, base + " bộ", true);
        UUID r1 = data.lessonReport(lesson, "waiting_teacher");
        data.lessonReport(lesson, "waiting_teacher");
        data.deckReport(deck, "waiting_teacher");

        asAdmin(get(USERS + "/" + teacher)).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content.waitingTeacherReports").value(3));
        lock(teacher, "Vi phạm").andExpect(status().isOk());

        assertThat(data.lessonStatus(lesson)).isEqualTo("published");
        assertThat(data.deckStatus(deck)).isEqualTo("published");
        assertThat(data.reportStatus(r1)).isEqualTo("waiting_teacher");
    }

    @Test
    void lock_alreadyLocked_conflictWithoutNewEntry_AC_QT_08() throws Exception {
        UUID student = data.user(Role.STUDENT, base + " Học viên");
        lock(student, "Lần đầu").andExpect(status().isOk());

        lock(student, "Lần hai").andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("USER_ALREADY_LOCKED"));
        assertThat(data.countAudit(student, "lock")).isEqualTo(1);
    }

    @Test
    void lock_selfOrOtherAdmin_forbidden_AC_QT_09() throws Exception {
        UUID otherAdmin = data.admin();

        lock(admin, "Tự khóa").andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("USER_PROTECTED"));
        lock(otherAdmin, "Khóa quản trị viên").andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("USER_PROTECTED"));
        assertThat(data.locked(otherAdmin)).isFalse();
    }

    @Test
    void lock_blankReason_rejected_AC_QT_10() throws Exception {
        UUID student = data.user(Role.STUDENT, base + " Học viên");

        lock(student, "  ").andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"))
                .andExpect(jsonPath("$.errors[0].field").value("reason"))
                .andExpect(jsonPath("$.errors[0].message").value("Lý do khóa là bắt buộc"));
        assertThat(data.locked(student)).isFalse();
    }

    @Test
    void lock_reasonTooLong_rejected_AC_QT_47() throws Exception {
        UUID student = data.user(Role.STUDENT, base + " Học viên");

        lock(student, "a".repeat(501)).andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[0].message").value("Lý do khóa tối đa 500 ký tự"));
        assertThat(data.locked(student)).isFalse();
    }

    @Test
    void lockAndUnlock_proStudent_keepsProEndDate_AC_QT_48() throws Exception {
        UUID student = data.user(Role.STUDENT, base + " Phạm Đức");
        Instant endsAt = Instant.now().plus(29, ChronoUnit.DAYS).truncatedTo(ChronoUnit.SECONDS);
        data.grantPro(student, endsAt);

        lock(student, "Spam").andExpect(status().isOk());
        asAdmin(post(USERS + "/" + student + "/unlock")).andExpect(status().isOk());

        assertThat(data.proEndsAt(student)).isEqualTo(endsAt);
    }

    // ---------------------------------------------------------------- UC-QT-03

    @Test
    void unlock_lockedStudent_activeAgain_AC_QT_13() throws Exception {
        UUID student = data.user(Role.STUDENT, base + " Phạm Đức");
        lock(student, "Nhiều lần đăng bình luận spam").andExpect(status().isOk());

        asAdmin(get(USERS + "/" + student)).andExpect(jsonPath("$.data.lockedReason")
                .value("Nhiều lần đăng bình luận spam"));
        asAdmin(post(USERS + "/" + student + "/unlock")).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.locked").value(false))
                .andExpect(jsonPath("$.data.lockedReason").doesNotExist());

        assertThat(data.countAudit(student, "unlock")).isEqualTo(1);
        mockMvc.perform(get("/api/v1/users/me").header(HttpHeaders.AUTHORIZATION, data.bearer(student, Role.STUDENT)))
                .andExpect(status().isOk());
    }

    @Test
    void unlock_alreadyActive_conflictWithoutNewEntry_AC_QT_15() throws Exception {
        UUID student = data.user(Role.STUDENT, base + " Học viên");

        asAdmin(post(USERS + "/" + student + "/unlock")).andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("USER_NOT_LOCKED"));
        assertThat(data.countAudit(student, "unlock")).isZero();
    }

    // ---------------------------------------------------------------- UC-QT-04

    @Test
    void changeRole_studentToTeacher_takesEffectImmediately_AC_QT_18() throws Exception {
        UUID student = data.user(Role.STUDENT, base + " Nguyễn Minh Anh");
        String oldToken = data.bearer(student, Role.STUDENT);

        changeRole(student, "teacher").andExpect(status().isOk())
                .andExpect(jsonPath("$.data.role").value("teacher"))
                .andExpect(jsonPath("$.data.creditBalance").value(0));

        assertThat(data.role(student)).isEqualTo("teacher");
        // Token mang vai trò cũ bị từ chối; client làm mới phiên để nhận vai trò mới.
        mockMvc.perform(get("/api/v1/users/me").header(HttpHeaders.AUTHORIZATION, oldToken))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/v1/teacher/lessons")
                .header(HttpHeaders.AUTHORIZATION, data.bearer(student, Role.TEACHER)))
                .andExpect(status().isOk());
    }

    @Test
    void changeRole_teacherWithoutContentToStudent_AC_QT_19() throws Exception {
        UUID teacher = data.teacher(base + " Lê Thanh");

        changeRole(teacher, "student").andExpect(status().isOk())
                .andExpect(jsonPath("$.data.role").value("student"))
                .andExpect(jsonPath("$.data.plan").value("free"));
        mockMvc.perform(get("/api/v1/teacher/lessons")
                .header(HttpHeaders.AUTHORIZATION, data.bearer(teacher, Role.STUDENT)))
                .andExpect(status().isForbidden());
    }

    @Test
    void changeRole_teacherWithContent_rejectedWithCounts_AC_QT_20() throws Exception {
        UUID teacher = data.teacher(base + " Lê Thanh");
        for (int i = 0; i < 3; i++) {
            data.lesson(teacher, base + " bài " + i, true);
        }
        data.lesson(teacher, base + " nháp", false);
        data.deck(teacher, base + " bộ 1", true);
        data.deck(teacher, base + " bộ 2", true);

        changeRole(teacher, "student").andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("USER_TEACHER_HAS_CONTENT"))
                .andExpect(jsonPath("$.details.lessons").value(4))
                .andExpect(jsonPath("$.details.decks").value(2));
        assertThat(data.role(teacher)).isEqualTo("teacher");
    }

    @Test
    void changeRole_lockedAccount_rejected_AC_QT_21() throws Exception {
        UUID student = data.user(Role.STUDENT, base + " Phạm Đức");
        data.lock(student);

        changeRole(student, "teacher").andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("USER_LOCKED_ROLE_CHANGE"));
        assertThat(data.role(student)).isEqualTo("student");
    }

    @Test
    void changeRole_selfOrOtherAdmin_forbidden_AC_QT_22() throws Exception {
        UUID otherAdmin = data.admin();

        changeRole(admin, "teacher").andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("USER_PROTECTED"));
        changeRole(otherAdmin, "student").andExpect(status().isForbidden());
        assertThat(data.role(otherAdmin)).isEqualTo("admin");
    }

    @Test
    void changeRole_toAdmin_rejected_BR_QT_02() throws Exception {
        UUID student = data.user(Role.STUDENT, base + " Học viên");

        changeRole(student, "admin").andExpect(status().isBadRequest());
        assertThat(data.role(student)).isEqualTo("student");
    }

    @Test
    void changeRole_studentWithActivePro_rejected_AC_QT_49() throws Exception {
        UUID student = data.user(Role.STUDENT, base + " Nguyễn Minh Anh");
        data.grantPro(student, Instant.now().plus(20, ChronoUnit.DAYS));

        changeRole(student, "teacher").andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("USER_ACTIVE_PRO"))
                .andExpect(jsonPath("$.details.endsAt").exists());
        assertThat(data.role(student)).isEqualTo("student");
    }

    @Test
    void changeRole_teacherToStudent_cancelsTeacherCredit_AC_QT_50() throws Exception {
        UUID teacher = data.teacher(base + " Lê Thanh");
        data.setCredits(teacher, 1200);

        asAdmin(get(USERS + "/" + teacher)).andExpect(jsonPath("$.data.creditBalance").value(1200));
        changeRole(teacher, "student").andExpect(status().isOk());

        // Ví bị hủy rồi nạp lại ngay theo gói Free khi đọc chi tiết (mốc đặt lại hằng ngày được đặt).
        assertThat(data.walletBalance(teacher)).isLessThan(1200);
        assertThat(data.countAudit(teacher, "change_role")).isEqualTo(1);
        mockMvc.perform(get("/api/v1/credits/balance")
                .header(HttpHeaders.AUTHORIZATION, data.bearer(teacher, Role.STUDENT)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.kind").value("free"));
        assertThat(data.walletHasReset(teacher)).isTrue();
    }

    @Test
    void changeRole_personalContentDoesNotBlock_AC_QT_54() throws Exception {
        UUID teacher = data.teacher(base + " Hoàng Lan");
        UUID personalLesson = data.lesson(teacher, base + " bài cá nhân", "personal", false);
        UUID personalDeck = data.deck(teacher, base + " bộ cá nhân", "personal", false);

        changeRole(teacher, "student").andExpect(status().isOk());

        assertThat(data.lessonOwner(personalLesson)).isEqualTo(teacher);
        assertThat(data.deckOwner(personalDeck)).isEqualTo(teacher);
    }
}
