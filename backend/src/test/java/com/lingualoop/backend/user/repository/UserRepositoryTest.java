package com.lingualoop.backend.user.repository;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.Instant;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.dao.DataIntegrityViolationException;

import com.lingualoop.backend.TestcontainersConfiguration;
import com.lingualoop.backend.security.Role;
import com.lingualoop.backend.user.entity.User;

@SpringBootTest
@Import(TestcontainersConfiguration.class)
class UserRepositoryTest {

    @Autowired
    private UserRepository userRepository;

    /** Tài khoản không xóa được (BR-NK-16), nên mỗi test dùng email và Google ID riêng thay vì dọn bảng. */
    private final String run = UUID.randomUUID().toString().substring(0, 8);

    private String mail(String email) {
        return email.replace("@", "-" + run + "@");
    }

    private String sub(String googleSub) {
        return googleSub + "-" + run;
    }

    private User newUser(String email, String displayName) {
        return User.createLocal(email, displayName, "hash", Instant.now());
    }

    @Test
    void findByEmail_isCaseInsensitive() {
        userRepository.saveAndFlush(newUser(mail("a@x.com"), "An"));

        assertThat(userRepository.findByEmail(mail("A@x.com")))
                .hasValueSatisfying(user -> assertThat(user.getEmail()).isEqualToIgnoringCase(mail("a@x.com")));
        assertThat(userRepository.existsByEmail(mail("A@X.COM"))).isTrue();
        assertThat(userRepository.existsByEmail(mail("other@x.com"))).isFalse();
    }

    @Test
    void save_newLocalUser_hasStudentRoleUnverifiedAndAuditColumns() {
        User saved = userRepository.saveAndFlush(newUser(mail("b@x.com"), "Binh"));

        User found = userRepository.findById(saved.getId()).orElseThrow();
        assertThat(found.getRole()).isEqualTo(Role.STUDENT);
        assertThat(found.isEmailVerified()).isFalse();
        assertThat(found.isLocked()).isFalse();
        assertThat(found.getOnboardedAt()).isNull();
        assertThat(found.getTermsAcceptedAt()).isNotNull();
        assertThat(found.getCreatedAt()).isNotNull();
    }

    @Test
    void save_twoUsersWithSameDisplayName_isAllowed() {
        long before = userRepository.count();
        userRepository.saveAndFlush(newUser(mail("c1@x.com"), "Trùng Tên"));
        userRepository.saveAndFlush(newUser(mail("c2@x.com"), "Trùng Tên"));

        assertThat(userRepository.count()).isEqualTo(before + 2);
    }

    @Test
    void save_duplicateEmailIgnoringCase_throws() {
        userRepository.saveAndFlush(newUser(mail("d@x.com"), "D1"));

        assertThatThrownBy(() -> userRepository.saveAndFlush(newUser(mail("D@x.com"), "D2")))
                .isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    void findByGoogleSub_returnsLinkedUser() {
        User google = User.createFromGoogle(sub("sub-1"), mail("g@x.com"), "Gia", "https://img/a.png", Instant.now());
        userRepository.saveAndFlush(google);

        assertThat(userRepository.findByGoogleSub(sub("sub-1")))
                .hasValueSatisfying(u -> assertThat(u.getEmail()).isEqualTo(mail("g@x.com")));
        assertThat(userRepository.findByGoogleSub(sub("sub-other"))).isEmpty();
    }

    @Test
    void createFromGoogle_isVerifiedStudentWithoutPasswordOrTerms() {
        User saved = userRepository.saveAndFlush(User.createFromGoogle(sub("sub-2"), mail("h@x.com"), "Hoa", "https://img/h.png", Instant.now()));

        User found = userRepository.findById(saved.getId()).orElseThrow();
        assertThat(found.isEmailVerified()).isTrue();
        assertThat(found.hasPassword()).isFalse();
        assertThat(found.getTermsAcceptedAt()).isNull();
        assertThat(found.getRole()).isEqualTo(Role.STUDENT);
        assertThat(found.getGoogleSub()).isEqualTo(sub("sub-2"));
        assertThat(found.getAvatarUrl()).isEqualTo("https://img/h.png");
    }

    @Test
    void save_duplicateGoogleSub_throws() {
        userRepository.saveAndFlush(User.createFromGoogle(sub("sub-3"), mail("i1@x.com"), "I1", null, Instant.now()));

        assertThatThrownBy(() -> userRepository.saveAndFlush(User.createFromGoogle(sub("sub-3"), mail("i2@x.com"), "I2", null, Instant.now())))
                .isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    void linkGoogle_unverifiedAccount_dropsPasswordAndVerifiesEmail() {
        User local = userRepository.saveAndFlush(newUser(mail("j@x.com"), "Jin"));

        boolean passwordCleared = local.linkGoogle(sub("sub-4"), Instant.now());
        userRepository.saveAndFlush(local);

        User found = userRepository.findByGoogleSub(sub("sub-4")).orElseThrow();
        assertThat(passwordCleared).isTrue();
        assertThat(found.hasPassword()).isFalse();
        assertThat(found.isEmailVerified()).isTrue();
    }

    @Test
    void linkGoogle_verifiedAccount_keepsPassword() {
        User local = newUser(mail("k@x.com"), "Kim");
        local.markEmailVerified(Instant.now());
        userRepository.saveAndFlush(local);

        boolean passwordCleared = local.linkGoogle(sub("sub-5"), Instant.now());
        userRepository.saveAndFlush(local);

        User found = userRepository.findByGoogleSub(sub("sub-5")).orElseThrow();
        assertThat(passwordCleared).isFalse();
        assertThat(found.hasPassword()).isTrue();
        assertThat(found.isEmailVerified()).isTrue();
    }

    @Test
    void changePassword_replacesHash() {
        User local = userRepository.saveAndFlush(newUser(mail("l@x.com"), "Linh"));

        local.changePassword("new-hash");
        userRepository.saveAndFlush(local);

        assertThat(userRepository.findById(local.getId()).orElseThrow().getPasswordHash()).isEqualTo("new-hash");
    }
}
