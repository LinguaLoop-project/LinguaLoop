package com.lingualoop.backend.auth.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;

import com.lingualoop.backend.TestcontainersConfiguration;
import com.lingualoop.backend.auth.entity.RefreshToken;
import com.lingualoop.backend.auth.repository.RefreshTokenRepository;
import com.lingualoop.backend.auth.service.RefreshTokenService.Rotation;
import com.lingualoop.backend.auth.service.RefreshTokenService.Session;
import com.lingualoop.backend.common.exception.ErrorCode;
import com.lingualoop.backend.support.MutableClock;
import com.lingualoop.backend.support.TestClockConfiguration;
import com.lingualoop.backend.user.dto.UserAccount;
import com.lingualoop.backend.user.service.UserAccountService;

@SpringBootTest
@Import({ TestcontainersConfiguration.class, TestClockConfiguration.class })
class RefreshTokenServiceTest {

    @Autowired
    private RefreshTokenService service;

    @Autowired
    private RefreshTokenRepository repository;

    @Autowired
    private UserAccountService userAccountService;

    @Autowired
    private MutableClock clock;

    private UUID userId;

    @BeforeEach
    void setUp() {
        clock.reset();
        UserAccount user = userAccountService.createLocal("rt-" + UUID.randomUUID() + "@x.com", "Rt", "hash");
        userId = user.id();
    }

    private List<RefreshToken> tokensOf(UUID familyId) {
        return repository.findAll().stream().filter(t -> t.getFamilyId().equals(familyId)).toList();
    }

    private RefreshToken byRaw(String raw) {
        return repository.findByTokenHash(SecureTokens.sha256(raw)).orElseThrow();
    }

    @Test
    void startSession_storesOnlyHashAndUserAgentWith30DayExpiry_AC08() {
        String raw = service.startSession(userId, "JUnit/5").rawToken();

        RefreshToken stored = byRaw(raw);
        assertThat(stored.getTokenHash()).isNotEqualTo(raw);
        assertThat(stored.getUserId()).isEqualTo(userId);
        assertThat(stored.getUserAgent()).isEqualTo("JUnit/5");
        assertThat(stored.getRevokedAt()).isNull();
        assertThat(stored.getExpiresAt()).isBetween(Instant.now().plus(Duration.ofDays(30)).minusSeconds(5),
                Instant.now().plus(Duration.ofDays(30)).plusSeconds(5));
    }

    @Test
    void rotate_validToken_revokesOldIssuesNewInSameFamily_AC27() {
        String first = service.startSession(userId, "ua").rawToken();

        Rotation rotation = service.rotate(first, "ua");

        assertThat(rotation.userId()).isEqualTo(userId);
        assertThat(rotation.rawToken()).isNotEqualTo(first);
        RefreshToken old = byRaw(first);
        RefreshToken next = byRaw(rotation.rawToken());
        assertThat(old.getRevokedAt()).isNotNull();
        assertThat(next.getRevokedAt()).isNull();
        assertThat(next.getFamilyId()).isEqualTo(old.getFamilyId()).isEqualTo(rotation.familyId());
    }

    @Test
    void rotate_slidesExpiryFromTheTimeOfUse_BRAUTH07() {
        String first = service.startSession(userId, "ua").rawToken();
        clock.advance(Duration.ofDays(20));

        Rotation rotation = service.rotate(first, "ua");

        assertThat(byRaw(rotation.rawToken()).getExpiresAt())
                .isAfter(Instant.now().plus(Duration.ofDays(49)))
                .isBefore(Instant.now().plus(Duration.ofDays(51)));
    }

    @Test
    void rotate_unknownToken_throwsRefreshInvalid_AC27() {
        assertThatThrownBy(() -> service.rotate("no-such-token", "ua"))
                .isInstanceOf(RefreshInvalidException.class)
                .extracting("errorCode").isEqualTo(ErrorCode.AUTH_REFRESH_INVALID);
    }

    @Test
    void rotate_afterThirtyDaysUnused_throwsRefreshInvalid_AC27() {
        String raw = service.startSession(userId, "ua").rawToken();

        clock.advance(Duration.ofDays(30).plusSeconds(1));

        assertThatThrownBy(() -> service.rotate(raw, "ua")).isInstanceOf(RefreshInvalidException.class);
    }

    @Test
    void rotate_reusedAfterGraceWindow_revokesWholeFamily_AC27() {
        String first = service.startSession(userId, "ua").rawToken();
        Rotation second = service.rotate(first, "ua");
        clock.advance(Duration.ofSeconds(11));

        assertThatThrownBy(() -> service.rotate(first, "ua")).isInstanceOf(RefreshInvalidException.class);

        // dấu hiệu token bị trộm: token mới cấp ra từ lần xoay hợp lệ cũng phải chết
        assertThat(tokensOf(second.familyId())).allSatisfy(t -> assertThat(t.getRevokedAt()).isNotNull());
        assertThatThrownBy(() -> service.rotate(second.rawToken(), "ua")).isInstanceOf(RefreshInvalidException.class);
    }

    @Test
    void rotate_reusedWithinGraceWindow_issuesAnotherTokenInSameFamily_AC27() {
        String first = service.startSession(userId, "ua").rawToken();
        Rotation second = service.rotate(first, "ua");
        clock.advance(Duration.ofSeconds(9));

        Rotation third = service.rotate(first, "ua");

        assertThat(third.familyId()).isEqualTo(second.familyId());
        assertThat(byRaw(second.rawToken()).getRevokedAt()).isNull();
        assertThat(byRaw(third.rawToken()).getRevokedAt()).isNull();
    }

    @Test
    void rotate_afterSessionRevoked_noGraceEvenWithinTenSeconds_AC25() {
        String first = service.startSession(userId, "ua").rawToken();
        Rotation second = service.rotate(first, "ua");

        service.revokeSession(second.rawToken());

        assertThatThrownBy(() -> service.rotate(first, "ua")).isInstanceOf(RefreshInvalidException.class);
        assertThatThrownBy(() -> service.rotate(second.rawToken(), "ua")).isInstanceOf(RefreshInvalidException.class);
    }

    @Test
    void revokeSession_unknownToken_isIgnored_AC25() {
        assertThatCode(() -> {
            service.revokeSession("no-such-token");
            service.revokeSession(null);
        }).doesNotThrowAnyException();
    }

    @Test
    void startSession_returnsFamilyIdOfStoredToken_AC41() {
        Session session = service.startSession(userId, "ua");

        assertThat(byRaw(session.rawToken()).getFamilyId()).isEqualTo(session.familyId());
    }

    @Test
    void revokeAllForUser_revokesEveryFamilyOfThatUserOnly_AC20() {
        Session a = service.startSession(userId, "ua");
        Session b = service.startSession(userId, "ua");
        UUID otherUser = userAccountService.createLocal("rt-" + UUID.randomUUID() + "@x.com", "Other", "hash").id();
        Session others = service.startSession(otherUser, "ua");

        service.revokeAllForUser(userId);

        assertThat(byRaw(a.rawToken()).getRevokedAt()).isNotNull();
        assertThat(byRaw(b.rawToken()).getRevokedAt()).isNotNull();
        assertThat(byRaw(others.rawToken()).getRevokedAt()).isNull();
        assertThatThrownBy(() -> service.rotate(a.rawToken(), "ua")).isInstanceOf(RefreshInvalidException.class);
    }

    @Test
    void revokeAllExcept_keepsGivenFamilyAndRevokesTheRest_AC41() {
        Session current = service.startSession(userId, "ua");
        Session other = service.startSession(userId, "ua");
        UUID otherUser = userAccountService.createLocal("rt-" + UUID.randomUUID() + "@x.com", "Other", "hash").id();
        Session strangers = service.startSession(otherUser, "ua");

        service.revokeAllExcept(userId, current.familyId());

        assertThat(byRaw(current.rawToken()).getRevokedAt()).isNull();
        assertThat(byRaw(other.rawToken()).getRevokedAt()).isNotNull();
        assertThat(byRaw(strangers.rawToken()).getRevokedAt()).isNull();
        assertThatThrownBy(() -> service.rotate(other.rawToken(), "ua")).isInstanceOf(RefreshInvalidException.class);
        assertThatCode(() -> service.rotate(current.rawToken(), "ua")).doesNotThrowAnyException();
    }

    @Test
    void revokeAllExcept_nullFamily_revokesEverySession_AC41() {
        Session a = service.startSession(userId, "ua");
        Session b = service.startSession(userId, "ua");

        service.revokeAllExcept(userId, null);

        assertThat(byRaw(a.rawToken()).getRevokedAt()).isNotNull();
        assertThat(byRaw(b.rawToken()).getRevokedAt()).isNotNull();
    }
}
