package com.lingualoop.backend.user.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;

import com.lingualoop.backend.TestcontainersConfiguration;
import com.lingualoop.backend.common.exception.FieldValidationException;
import com.lingualoop.backend.common.exception.NotFoundException;
import com.lingualoop.backend.user.dto.UserAccountView;

@SpringBootTest
@Import(TestcontainersConfiguration.class)
class UserAccountServiceTest {

    @Autowired
    private UserAccountService service;

    @Test
    void createLocal_thenFindByEmailIgnoringCase() {
        String email = "svc-" + UUID.randomUUID() + "@x.com";

        UserAccountView created = service.createLocal(email, "Lan", "hash");

        assertThat(created.emailVerified()).isFalse();
        assertThat(created.locked()).isFalse();
        assertThat(service.findByEmail(email.toUpperCase()))
                .hasValueSatisfying(found -> assertThat(found.id()).isEqualTo(created.id()));
        assertThat(service.findById(created.id())).isPresent();
        assertThat(service.findByEmail("nobody-" + UUID.randomUUID() + "@x.com")).isEmpty();
    }

    @Test
    void markEmailVerified_setsFlag() {
        UserAccountView created = service.createLocal("v-" + UUID.randomUUID() + "@x.com", "Vy", "hash");

        service.markEmailVerified(created.id());

        assertThat(service.findById(created.id()).orElseThrow().emailVerified()).isTrue();
    }

    private String uniqueSub() {
        return "sub-" + UUID.randomUUID();
    }

    @Test
    void createFromGoogle_thenFindByGoogleSub() {
        String sub = uniqueSub();

        UserAccountView created = service.createFromGoogle(sub, "g-" + UUID.randomUUID() + "@x.com", "Gia", "https://img/g.png");

        assertThat(created.emailVerified()).isTrue();
        assertThat(created.hasPassword()).isFalse();
        assertThat(created.googleLinked()).isTrue();
        assertThat(created.displayName()).isEqualTo("Gia");
        assertThat(created.avatarUrl()).isEqualTo("https://img/g.png");
        assertThat(service.findByGoogleSub(sub)).hasValueSatisfying(u -> assertThat(u.id()).isEqualTo(created.id()));
        assertThat(service.findByGoogleSub(uniqueSub())).isEmpty();
    }

    @Test
    void createFromGoogle_nameBlank_usesEmailLocalPart() {
        UserAccountView created = service.createFromGoogle(uniqueSub(), "hoa.tran." + UUID.randomUUID() + "@x.com", "  ", null);

        assertThat(created.displayName()).startsWith("hoa.tran.");
        assertThat(created.displayName()).doesNotContain("@");
    }

    @Test
    void createFromGoogle_longName_isCutTo50Chars() {
        UserAccountView created = service.createFromGoogle(uniqueSub(), "long-" + UUID.randomUUID() + "@x.com", "N".repeat(80), null);

        assertThat(created.displayName()).hasSize(50);
    }

    @Test
    void linkGoogle_unverifiedLocalAccount_clearsPasswordAndReportsIt() {
        UserAccountView local = service.createLocal("lk-" + UUID.randomUUID() + "@x.com", "Lan", "hash");
        String sub = uniqueSub();

        boolean passwordCleared = service.linkGoogle(local.id(), sub);

        UserAccountView after = service.findById(local.id()).orElseThrow();
        assertThat(passwordCleared).isTrue();
        assertThat(after.hasPassword()).isFalse();
        assertThat(after.emailVerified()).isTrue();
        assertThat(after.googleLinked()).isTrue();
        assertThat(service.findByGoogleSub(sub)).isPresent();
    }

    @Test
    void linkGoogle_verifiedLocalAccount_keepsPassword() {
        UserAccountView local = service.createLocal("lv-" + UUID.randomUUID() + "@x.com", "Van", "hash");
        service.markEmailVerified(local.id());

        boolean passwordCleared = service.linkGoogle(local.id(), uniqueSub());

        assertThat(passwordCleared).isFalse();
        assertThat(service.findById(local.id()).orElseThrow().hasPassword()).isTrue();
    }

    @Test
    void linkGoogle_unknownUser_throwsNotFound() {
        assertThatThrownBy(() -> service.linkGoogle(UUID.randomUUID(), uniqueSub()))
                .isInstanceOf(NotFoundException.class);
    }

    @Test
    void updatePasswordHash_setsHashForGoogleOnlyUser() {
        UserAccountView google = service.createFromGoogle(uniqueSub(), "up-" + UUID.randomUUID() + "@x.com", "Uyen", null);

        service.updatePasswordHash(google.id(), "bcrypt-hash");

        UserAccountView after = service.findById(google.id()).orElseThrow();
        assertThat(after.hasPassword()).isTrue();
        assertThat(after.passwordHash()).isEqualTo("bcrypt-hash");
    }

    @Test
    void updatePasswordHash_unknownUser_throwsNotFound() {
        assertThatThrownBy(() -> service.updatePasswordHash(UUID.randomUUID(), "x"))
                .isInstanceOf(NotFoundException.class);
    }

    // ── Hồ sơ học tập (UC-TK-08) ──

    private UserAccountView newGoogleStudent() {
        return service.createFromGoogle(uniqueSub(), "lp-" + UUID.randomUUID() + "@x.com", "Linh", null);
    }

    @Test
    void saveLearningProfile_firstTime_marksOnboardedAndStoresEverything() {
        UserAccountView google = newGoogleStudent();
        assertThat(google.onboarded()).isFalse();
        assertThat(google.termsAccepted()).isFalse();

        UserAccountView saved = service.saveLearningProfile(google.id(), "  Linh Nguyen ", 20, "en", "Asia/Tokyo", true);

        assertThat(saved.onboarded()).isTrue();
        assertThat(saved.termsAccepted()).isTrue();
        assertThat(saved.displayName()).isEqualTo("Linh Nguyen");
        assertThat(saved.dailyMinutes()).isEqualTo(20);
        assertThat(saved.uiLanguage()).isEqualTo("en");
        assertThat(saved.timezone()).isEqualTo("Asia/Tokyo");
    }

    @Test
    void saveLearningProfile_termsNotAcceptedYet_rejectsAndStoresNothing_AC_TK_50() {
        UserAccountView google = newGoogleStudent();

        assertThatThrownBy(() -> service.saveLearningProfile(google.id(), "Linh", 15, "vi", "Asia/Ho_Chi_Minh", false))
                .isInstanceOfSatisfying(FieldValidationException.class,
                        e -> assertThat(e.fieldErrors().get(0).field()).isEqualTo("acceptTerms"));

        UserAccountView after = service.findById(google.id()).orElseThrow();
        assertThat(after.onboarded()).isFalse();
        assertThat(after.termsAccepted()).isFalse();
    }

    @Test
    void saveLearningProfile_emailRegisteredUser_doesNotNeedToAcceptTermsAgain() {
        UserAccountView local = service.createLocal("lp-" + UUID.randomUUID() + "@x.com", "Lan", "hash");
        assertThat(local.termsAccepted()).isTrue();

        UserAccountView saved = service.saveLearningProfile(local.id(), "Lan", 10, "vi", "Asia/Ho_Chi_Minh", false);

        assertThat(saved.onboarded()).isTrue();
        assertThat(saved.dailyMinutes()).isEqualTo(10);
    }

    @Test
    void saveLearningProfile_secondTime_updatesWithoutChangingOnboardedFlag() {
        UserAccountView google = newGoogleStudent();
        service.saveLearningProfile(google.id(), "Linh", 15, "vi", "Asia/Ho_Chi_Minh", true);

        UserAccountView saved = service.saveLearningProfile(google.id(), "Linh", 30, "en", "Asia/Seoul", false);

        assertThat(saved.onboarded()).isTrue();
        assertThat(saved.termsAccepted()).isTrue();
        assertThat(saved.dailyMinutes()).isEqualTo(30);
        assertThat(saved.timezone()).isEqualTo("Asia/Seoul");
    }

    @Test
    void saveLearningProfile_invalidFields_reportTheRightField_AC_TK_49() {
        UserAccountView local = service.createLocal("lp-" + UUID.randomUUID() + "@x.com", "Lan", "hash");
        UUID id = local.id();

        assertThat(rejectedField(() -> service.saveLearningProfile(id, "   ", 15, "vi", "Asia/Ho_Chi_Minh", true)))
                .isEqualTo("displayName");
        assertThat(rejectedField(() -> service.saveLearningProfile(id, "N".repeat(51), 15, "vi", "Asia/Ho_Chi_Minh", true)))
                .isEqualTo("displayName");
        assertThat(rejectedField(() -> service.saveLearningProfile(id, "Lan", 25, "vi", "Asia/Ho_Chi_Minh", true)))
                .isEqualTo("dailyMinutes");
        assertThat(rejectedField(() -> service.saveLearningProfile(id, "Lan", 15, "fr", "Asia/Ho_Chi_Minh", true)))
                .isEqualTo("uiLanguage");
        assertThat(rejectedField(() -> service.saveLearningProfile(id, "Lan", 15, "vi", "Not/AZone", true)))
                .isEqualTo("timezone");
        assertThat(service.findById(id).orElseThrow().onboarded()).isFalse();
    }

    @Test
    void saveLearningProfile_nameWith50Chars_isAccepted_AC_TK_49() {
        UserAccountView local = service.createLocal("lp-" + UUID.randomUUID() + "@x.com", "Lan", "hash");

        UserAccountView saved = service.saveLearningProfile(local.id(), "N".repeat(50), 15, "vi", "Asia/Ho_Chi_Minh", true);

        assertThat(saved.displayName()).hasSize(50);
    }

    @Test
    void saveLearningProfile_unknownUser_throwsNotFound() {
        assertThatThrownBy(() -> service.saveLearningProfile(UUID.randomUUID(), "A", 15, "vi", "Asia/Ho_Chi_Minh", true))
                .isInstanceOf(NotFoundException.class);
    }

    private static String rejectedField(org.assertj.core.api.ThrowableAssert.ThrowingCallable call) {
        Throwable thrown = org.assertj.core.api.Assertions.catchThrowable(call);
        assertThat(thrown).isInstanceOf(FieldValidationException.class);
        return ((FieldValidationException) thrown).fieldErrors().get(0).field();
    }
}
