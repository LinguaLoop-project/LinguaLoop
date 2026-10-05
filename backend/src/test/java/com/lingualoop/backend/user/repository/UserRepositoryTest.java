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
}
