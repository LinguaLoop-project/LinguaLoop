package com.lingualoop.backend.user.repository;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.Instant;

import org.junit.jupiter.api.BeforeEach;
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

    @BeforeEach
    void cleanUp() {
        userRepository.deleteAll();
    }

    private User newUser(String email, String displayName) {
        return User.createLocal(email, displayName, "hash", Instant.now());
    }

    @Test
    void findByEmail_isCaseInsensitive() {
        userRepository.saveAndFlush(newUser("a@x.com", "An"));

        assertThat(userRepository.findByEmail("A@x.com"))
                .hasValueSatisfying(user -> assertThat(user.getEmail()).isEqualToIgnoringCase("a@x.com"));
        assertThat(userRepository.existsByEmail("A@X.COM")).isTrue();
        assertThat(userRepository.existsByEmail("other@x.com")).isFalse();
    }

    @Test
    void save_newLocalUser_hasStudentRoleUnverifiedAndAuditColumns() {
        User saved = userRepository.saveAndFlush(newUser("b@x.com", "Binh"));

        User found = userRepository.findById(saved.getId()).orElseThrow();
        assertThat(found.getRole()).isEqualTo(Role.STUDENT);
        assertThat(found.isEmailVerified()).isFalse();
        assertThat(found.isDisabled()).isFalse();
        assertThat(found.getOnboardedAt()).isNull();
        assertThat(found.getTermsAcceptedAt()).isNotNull();
        assertThat(found.getCreatedAt()).isNotNull();
    }

    @Test
    void save_twoUsersWithSameDisplayName_isAllowed() {
        userRepository.saveAndFlush(newUser("c1@x.com", "Trùng Tên"));
        userRepository.saveAndFlush(newUser("c2@x.com", "Trùng Tên"));

        assertThat(userRepository.count()).isEqualTo(2);
    }

    @Test
    void save_duplicateEmailIgnoringCase_throws() {
        userRepository.saveAndFlush(newUser("d@x.com", "D1"));

        assertThatThrownBy(() -> userRepository.saveAndFlush(newUser("D@x.com", "D2")))
                .isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    void findByAuthUid_returnsLinkedUser() {
        User google = User.createFromGoogle("sub-1", "g@x.com", "Gia", "https://img/a.png");
        userRepository.saveAndFlush(google);

        assertThat(userRepository.findByAuthUid("sub-1"))
                .hasValueSatisfying(u -> assertThat(u.getEmail()).isEqualTo("g@x.com"));
        assertThat(userRepository.findByAuthUid("sub-other")).isEmpty();
    }

    @Test
    void createFromGoogle_isVerifiedStudentWithoutPasswordOrTerms() {
        User saved = userRepository.saveAndFlush(User.createFromGoogle("sub-2", "h@x.com", "Hoa", "https://img/h.png"));

        User found = userRepository.findById(saved.getId()).orElseThrow();
        assertThat(found.isEmailVerified()).isTrue();
        assertThat(found.hasPassword()).isFalse();
        assertThat(found.getTermsAcceptedAt()).isNull();
        assertThat(found.getRole()).isEqualTo(Role.STUDENT);
        assertThat(found.getAuthUid()).isEqualTo("sub-2");
        assertThat(found.getAvatarUrl()).isEqualTo("https://img/h.png");
    }

    @Test
    void save_duplicateAuthUid_throws() {
        userRepository.saveAndFlush(User.createFromGoogle("sub-3", "i1@x.com", "I1", null));

        assertThatThrownBy(() -> userRepository.saveAndFlush(User.createFromGoogle("sub-3", "i2@x.com", "I2", null)))
                .isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    void linkGoogle_unverifiedAccount_dropsPasswordAndVerifiesEmail() {
        User local = userRepository.saveAndFlush(newUser("j@x.com", "Jin"));

        boolean passwordCleared = local.linkGoogle("sub-4");
        userRepository.saveAndFlush(local);

        User found = userRepository.findByAuthUid("sub-4").orElseThrow();
        assertThat(passwordCleared).isTrue();
        assertThat(found.hasPassword()).isFalse();
        assertThat(found.isEmailVerified()).isTrue();
    }

    @Test
    void linkGoogle_verifiedAccount_keepsPassword() {
        User local = newUser("k@x.com", "Kim");
        local.markEmailVerified();
        userRepository.saveAndFlush(local);

        boolean passwordCleared = local.linkGoogle("sub-5");
        userRepository.saveAndFlush(local);

        User found = userRepository.findByAuthUid("sub-5").orElseThrow();
        assertThat(passwordCleared).isFalse();
        assertThat(found.hasPassword()).isTrue();
        assertThat(found.isEmailVerified()).isTrue();
    }

    @Test
    void changePassword_replacesHash() {
        User local = userRepository.saveAndFlush(newUser("l@x.com", "Linh"));

        local.changePassword("new-hash");
        userRepository.saveAndFlush(local);

        assertThat(userRepository.findById(local.getId()).orElseThrow().getPasswordHash()).isEqualTo("new-hash");
    }
}
