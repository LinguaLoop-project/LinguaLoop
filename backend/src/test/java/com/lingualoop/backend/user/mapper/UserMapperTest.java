package com.lingualoop.backend.user.mapper;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Instant;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.mapstruct.factory.Mappers;
import org.springframework.test.util.ReflectionTestUtils;

import com.lingualoop.backend.security.Role;
import com.lingualoop.backend.user.dto.UserAccount;
import com.lingualoop.backend.user.entity.User;

class UserMapperTest {

    private final UserMapper mapper = Mappers.getMapper(UserMapper.class);

    @Test
    void toUserAccount_localUser_mapsEveryFieldAndGoogleNotLinked() {
        User user = User.createLocal("a@x.com", "An", "hash", Instant.now());
        UUID id = UUID.randomUUID();
        ReflectionTestUtils.setField(user, "id", id);
        user.markEmailVerified();

        UserAccount account = mapper.toUserAccount(user);

        assertThat(account.id()).isEqualTo(id);
        assertThat(account.email()).isEqualTo("a@x.com");
        assertThat(account.displayName()).isEqualTo("An");
        assertThat(account.passwordHash()).isEqualTo("hash");
        assertThat(account.role()).isEqualTo(Role.STUDENT);
        assertThat(account.uiLanguage()).isEqualTo("vi");
        assertThat(account.emailVerified()).isTrue();
        assertThat(account.disabled()).isFalse();
        assertThat(account.onboarded()).isFalse();
        assertThat(account.googleLinked()).isFalse();
        assertThat(account.hasPassword()).isTrue();
    }

    @Test
    void toUserAccount_userWithAuthUid_isGoogleLinked() {
        User user = User.createLocal("g@x.com", "Gg", null, Instant.now());
        ReflectionTestUtils.setField(user, "authUid", "google-sub-123");

        UserAccount account = mapper.toUserAccount(user);

        assertThat(account.googleLinked()).isTrue();
        assertThat(account.hasPassword()).isFalse();
    }

    @Test
    void toUserAccount_userWithOnboardedAt_isOnboarded() {
        User user = User.createLocal("o@x.com", "Oo", "hash", Instant.now());
        ReflectionTestUtils.setField(user, "onboardedAt", Instant.now());

        assertThat(mapper.toUserAccount(user).onboarded()).isTrue();
    }
}
