package com.lingualoop.backend.user.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;

import com.lingualoop.backend.TestcontainersConfiguration;
import com.lingualoop.backend.common.exception.NotFoundException;
import com.lingualoop.backend.user.dto.UserAccount;

@SpringBootTest
@Import(TestcontainersConfiguration.class)
class UserAccountServiceTest {

    @Autowired
    private UserAccountService service;

    @Test
    void createLocal_thenFindByEmailIgnoringCase() {
        String email = "svc-" + UUID.randomUUID() + "@x.com";

        UserAccount created = service.createLocal(email, "Lan", "hash");

        assertThat(created.emailVerified()).isFalse();
        assertThat(created.disabled()).isFalse();
        assertThat(service.findByEmail(email.toUpperCase()))
                .hasValueSatisfying(found -> assertThat(found.id()).isEqualTo(created.id()));
        assertThat(service.findById(created.id())).isPresent();
        assertThat(service.findByEmail("nobody-" + UUID.randomUUID() + "@x.com")).isEmpty();
    }

    @Test
    void markEmailVerified_setsFlag() {
        UserAccount created = service.createLocal("v-" + UUID.randomUUID() + "@x.com", "Vy", "hash");

        service.markEmailVerified(created.id());

        assertThat(service.findById(created.id()).orElseThrow().emailVerified()).isTrue();
    }

    private String uniqueSub() {
        return "sub-" + UUID.randomUUID();
    }

    @Test
    void createFromGoogle_thenFindByGoogleSub() {
        String sub = uniqueSub();

        UserAccount created = service.createFromGoogle(sub, "g-" + UUID.randomUUID() + "@x.com", "Gia", "https://img/g.png");

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
        UserAccount created = service.createFromGoogle(uniqueSub(), "hoa.tran." + UUID.randomUUID() + "@x.com", "  ", null);

        assertThat(created.displayName()).startsWith("hoa.tran.");
        assertThat(created.displayName()).doesNotContain("@");
    }

    @Test
    void createFromGoogle_longName_isCutTo50Chars() {
        UserAccount created = service.createFromGoogle(uniqueSub(), "long-" + UUID.randomUUID() + "@x.com", "N".repeat(80), null);

        assertThat(created.displayName()).hasSize(50);
    }

    @Test
    void linkGoogle_unverifiedLocalAccount_clearsPasswordAndReportsIt() {
        UserAccount local = service.createLocal("lk-" + UUID.randomUUID() + "@x.com", "Lan", "hash");
        String sub = uniqueSub();

        boolean passwordCleared = service.linkGoogle(local.id(), sub);

        UserAccount after = service.findById(local.id()).orElseThrow();
        assertThat(passwordCleared).isTrue();
        assertThat(after.hasPassword()).isFalse();
        assertThat(after.emailVerified()).isTrue();
        assertThat(after.googleLinked()).isTrue();
        assertThat(service.findByGoogleSub(sub)).isPresent();
    }

    @Test
    void linkGoogle_verifiedLocalAccount_keepsPassword() {
        UserAccount local = service.createLocal("lv-" + UUID.randomUUID() + "@x.com", "Van", "hash");
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
        UserAccount google = service.createFromGoogle(uniqueSub(), "up-" + UUID.randomUUID() + "@x.com", "Uyen", null);

        service.updatePasswordHash(google.id(), "bcrypt-hash");

        UserAccount after = service.findById(google.id()).orElseThrow();
        assertThat(after.hasPassword()).isTrue();
        assertThat(after.passwordHash()).isEqualTo("bcrypt-hash");
    }

    @Test
    void updatePasswordHash_unknownUser_throwsNotFound() {
        assertThatThrownBy(() -> service.updatePasswordHash(UUID.randomUUID(), "x"))
                .isInstanceOf(NotFoundException.class);
    }
}
