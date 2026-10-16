package com.lingualoop.backend.user.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;

import java.util.Map;
import java.util.Set;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.TestPropertySource;

import com.lingualoop.backend.TestcontainersConfiguration;
import com.lingualoop.backend.user.enums.ConsentType;

/** Hợp đồng đồng ý xử lý dữ liệu mà shadowing (ghi âm, chấm AI) dùng */
@SpringBootTest
@Import(TestcontainersConfiguration.class)
@TestPropertySource(properties = "app.consent.policy-version=test-policy-7")
class ConsentServiceIntegrationTest {

    @Autowired private ConsentService consentService;
    @Autowired private UserAccountService userAccountService;
    @Autowired private JdbcTemplate jdbc;

    @Test
    void hasConsent_beforeAnyGrant_isFalse() {
        UUID user = newUser();

        assertThat(consentService.hasConsent(user, ConsentType.VOICE_STORAGE)).isFalse();
        assertThat(consentService.getGrantedTypes(user)).isEmpty();
    }

    @Test
    void grant_makesConsentActive_andRecordsPolicyVersionFromConfig() {
        UUID user = newUser();

        consentService.grant(user, ConsentType.VOICE_STORAGE);

        assertThat(consentService.hasConsent(user, ConsentType.VOICE_STORAGE)).isTrue();
        assertThat(consentService.getGrantedTypes(user)).containsExactly(ConsentType.VOICE_STORAGE);
        Map<String, Object> row = jdbc.queryForMap(
                "SELECT consent_type, policy_version, granted_at, revoked_at FROM user_consents WHERE user_id = ?",
                user);
        assertThat(row.get("consent_type")).isEqualTo("voice_storage");
        assertThat(row.get("policy_version")).isEqualTo("test-policy-7");
        assertThat(row.get("granted_at")).isNotNull();
        assertThat(row.get("revoked_at")).isNull();
    }

    @Test
    void grant_twice_keepsSingleActiveRecordAndDoesNotThrow() {
        UUID user = newUser();

        assertThatCode(() -> {
            consentService.grant(user, ConsentType.AI_PROCESSING);
            consentService.grant(user, ConsentType.AI_PROCESSING);
        }).doesNotThrowAnyException();

        assertThat(count(user, ConsentType.AI_PROCESSING, false)).isEqualTo(1);
        assertThat(count(user, ConsentType.AI_PROCESSING, true)).isEqualTo(1);
    }

    @Test
    void revoke_afterGrant_turnsConsentOffButKeepsRecordWithRevokedAt() {
        UUID user = newUser();
        consentService.grant(user, ConsentType.VOICE_STORAGE);

        consentService.revoke(user, ConsentType.VOICE_STORAGE);

        assertThat(consentService.hasConsent(user, ConsentType.VOICE_STORAGE)).isFalse();
        assertThat(consentService.getGrantedTypes(user)).isEmpty();
        assertThat(count(user, ConsentType.VOICE_STORAGE, false)).isEqualTo(1);
        assertThat(count(user, ConsentType.VOICE_STORAGE, true)).isZero();
        Object revokedAt = jdbc.queryForObject(
                "SELECT revoked_at FROM user_consents WHERE user_id = ?", Object.class, user);
        assertThat(revokedAt).isNotNull();
    }

    @Test
    void revoke_withoutGrant_doesNotThrowAndCreatesNothing() {
        UUID user = newUser();

        assertThatCode(() -> consentService.revoke(user, ConsentType.AI_PROCESSING)).doesNotThrowAnyException();

        assertThat(consentService.hasConsent(user, ConsentType.AI_PROCESSING)).isFalse();
        assertThat(count(user, ConsentType.AI_PROCESSING, false)).isZero();
    }

    @Test
    void revoke_twice_isIdempotent() {
        UUID user = newUser();
        consentService.grant(user, ConsentType.VOICE_STORAGE);
        consentService.revoke(user, ConsentType.VOICE_STORAGE);

        assertThatCode(() -> consentService.revoke(user, ConsentType.VOICE_STORAGE)).doesNotThrowAnyException();

        assertThat(count(user, ConsentType.VOICE_STORAGE, false)).isEqualTo(1);
    }

    @Test
    void grantRevokeGrant_keepsHistoryAndLeavesExactlyOneActiveRecord() {
        UUID user = newUser();

        consentService.grant(user, ConsentType.VOICE_STORAGE);
        consentService.revoke(user, ConsentType.VOICE_STORAGE);
        consentService.grant(user, ConsentType.VOICE_STORAGE);

        assertThat(consentService.hasConsent(user, ConsentType.VOICE_STORAGE)).isTrue();
        assertThat(count(user, ConsentType.VOICE_STORAGE, false)).isEqualTo(2);
        assertThat(count(user, ConsentType.VOICE_STORAGE, true)).isEqualTo(1);
    }

    @Test
    void consentTypes_areIndependent() {
        UUID user = newUser();

        consentService.grant(user, ConsentType.VOICE_STORAGE);
        consentService.grant(user, ConsentType.AI_PROCESSING);
        consentService.revoke(user, ConsentType.VOICE_STORAGE);

        assertThat(consentService.hasConsent(user, ConsentType.VOICE_STORAGE)).isFalse();
        assertThat(consentService.hasConsent(user, ConsentType.AI_PROCESSING)).isTrue();
        Set<ConsentType> granted = consentService.getGrantedTypes(user);
        assertThat(granted).containsExactly(ConsentType.AI_PROCESSING);
    }

    @Test
    void users_doNotAffectEachOther() {
        UUID a = newUser();
        UUID b = newUser();

        consentService.grant(a, ConsentType.VOICE_STORAGE);
        assertThat(consentService.hasConsent(b, ConsentType.VOICE_STORAGE)).isFalse();

        consentService.grant(b, ConsentType.VOICE_STORAGE);
        consentService.revoke(a, ConsentType.VOICE_STORAGE);

        assertThat(consentService.hasConsent(a, ConsentType.VOICE_STORAGE)).isFalse();
        assertThat(consentService.hasConsent(b, ConsentType.VOICE_STORAGE)).isTrue();
        assertThat(consentService.getGrantedTypes(b)).containsExactly(ConsentType.VOICE_STORAGE);
    }

    private UUID newUser() {
        return userAccountService.createLocal("c-" + UUID.randomUUID() + "@x.com", "Consent", "h").id();
    }

    /** Đếm bản ghi của (user, type); {@code activeOnly} chỉ tính bản ghi chưa thu hồi. */
    private int count(UUID user, ConsentType type, boolean activeOnly) {
        String sql = "SELECT count(*) FROM user_consents WHERE user_id = ? AND consent_type = ?"
                + (activeOnly ? " AND revoked_at IS NULL" : "");
        Integer n = jdbc.queryForObject(sql, Integer.class, user, type.value());
        return n == null ? 0 : n;
    }
}
