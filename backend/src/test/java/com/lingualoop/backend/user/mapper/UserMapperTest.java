package com.lingualoop.backend.user.mapper;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Instant;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.mapstruct.factory.Mappers;
import org.springframework.test.util.ReflectionTestUtils;

import com.lingualoop.backend.security.Role;
import com.lingualoop.backend.user.dto.UserAccountView;
import com.lingualoop.backend.user.dto.response.MeResponse;
import com.lingualoop.backend.user.entity.User;

class UserMapperTest {

    private final UserMapper mapper = Mappers.getMapper(UserMapper.class);

    @Test
    void toUserAccount_localUser_mapsEveryFieldAndGoogleNotLinked() {
        User user = User.createLocal("a@x.com", "An", "hash", Instant.now());
        UUID id = UUID.randomUUID();
        ReflectionTestUtils.setField(user, "id", id);
        user.markEmailVerified();

        UserAccountView account = mapper.toUserAccountView(user);

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

        UserAccountView account = mapper.toUserAccountView(user);

        assertThat(account.googleLinked()).isTrue();
        assertThat(account.hasPassword()).isFalse();
    }

    @Test
    void toUserAccount_userWithOnboardedAt_isOnboarded() {
        User user = User.createLocal("o@x.com", "Oo", "hash", Instant.now());
        ReflectionTestUtils.setField(user, "onboardedAt", Instant.now());

        assertThat(mapper.toUserAccountView(user).onboarded()).isTrue();
    }

    @Test
    void toMe_accountWithPassword_mapsRoleValueAndHasPassword() {
        UUID id = UUID.randomUUID();
        UserAccountView account = new UserAccountView(id, "a@x.com", "An", "http://a/p.png", "hash", Role.ADMIN, "vi",
                true, false, true, false);

        MeResponse me = mapper.toMe(account);

        assertThat(me.id()).isEqualTo(id);
        assertThat(me.email()).isEqualTo("a@x.com");
        assertThat(me.displayName()).isEqualTo("An");
        assertThat(me.avatarUrl()).isEqualTo("http://a/p.png");
        assertThat(me.role()).isEqualTo("admin");
        assertThat(me.emailVerified()).isTrue();
        assertThat(me.onboarded()).isTrue();
        assertThat(me.hasPassword()).isTrue();
        assertThat(me.googleLinked()).isFalse();
    }

    @Test
    void toMe_googleOnlyAccount_hasNoPasswordAndIsGoogleLinked() {
        UserAccountView account = new UserAccountView(UUID.randomUUID(), "g@x.com", "Gg", null, null, Role.STUDENT,
                "vi", true, false, false, true);

        MeResponse me = mapper.toMe(account);

        assertThat(me.role()).isEqualTo("student");
        assertThat(me.hasPassword()).isFalse();
        assertThat(me.googleLinked()).isTrue();
    }
}
