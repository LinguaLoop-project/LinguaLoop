package com.lingualoop.backend.credit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.sql.Timestamp;
import java.time.Instant;
import java.util.UUID;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.JdbcTemplate;

import com.lingualoop.backend.TestcontainersConfiguration;
import com.lingualoop.backend.common.exception.BusinessException;
import com.lingualoop.backend.common.exception.ErrorCode;
import com.lingualoop.backend.credit.dto.CreditBalance;
import com.lingualoop.backend.support.MutableClock;
import com.lingualoop.backend.support.TestClockConfiguration;
import com.lingualoop.backend.support.TestData;
import com.lingualoop.backend.user.service.UserAccountService;

/** Ví credit AI: đặt lại theo giờ Việt Nam, tính phí theo token, không âm, ghi nhật ký (BR-GA). */
@SpringBootTest
@Import({TestcontainersConfiguration.class, TestClockConfiguration.class})
class CreditServiceIntegrationTest {

    @Autowired private CreditService creditService;
    @Autowired private UserAccountService userAccountService;
    @Autowired private JdbcTemplate jdbc;
    @Autowired private MutableClock clock;

    @AfterEach
    void restore() {
        clock.reset();
        jdbc.update("UPDATE ai_feature_prices SET input_price_vnd = 0, output_price_vnd = 0");
    }

    @Test
    void freeWalletResetsAtMidnightVietnam() {
        UUID user = newUser();
        Instant midnightVn = Instant.parse("2026-11-10T17:00:00Z");
        insertWallet(user, 0, midnightVn);

        clock.fixAt(Instant.parse("2026-11-10T16:59:00Z")); // 23:59 giờ VN
        assertThatThrownBy(() -> creditService.requireCanStart(user, AiFeature.SHADOWING_FEEDBACK))
                .isInstanceOfSatisfying(BusinessException.class, e -> {
                    assertThat(e.getErrorCode()).isEqualTo(ErrorCode.QUOTA_EXCEEDED);
                    assertThat(e.getDetails()).containsEntry("balance", 0).containsEntry("minBalance", 5);
                });

        clock.fixAt(Instant.parse("2026-11-10T17:01:00Z")); // 00:01 giờ VN
        creditService.requireCanStart(user, AiFeature.SHADOWING_FEEDBACK);
        CreditBalance balance = creditService.balanceOf(user);
        assertThat(balance.balance()).isEqualTo(20);
        assertThat(balance.kind()).isEqualTo("free");
        assertThat(balance.resetsAt()).isEqualTo(Instant.parse("2026-11-11T17:00:00Z"));
    }

    @Test
    void newFreeWalletStartsWithTheDailyCredits() {
        UUID user = newUser();

        CreditBalance balance = creditService.balanceOf(user);

        assertThat(balance.balance()).isEqualTo(20);
        assertThat(balance.resetsAt()).isAfter(Instant.now());
    }

    @Test
    void rejectionIsLogged() {
        UUID user = newUser();
        TestData.setCredits(jdbc, user, 4);

        assertThatThrownBy(() -> creditService.requireCanStart(user, AiFeature.LESSON_CHAT))
                .isInstanceOf(BusinessException.class);

        assertThat(logCount(user, "rejected_no_credit")).isEqualTo(1);
        assertThat(balanceOf(user)).isEqualTo(4);
    }

    @Test
    void chargeRoundsUpAndMinimumOne() {
        UUID user = newUser();
        TestData.setCredits(jdbc, user, 100);

        assertThat(creditService.charge(user, AiFeature.SHADOWING_FEEDBACK, 5000, 5000)).isEqualTo(1); // giá 0

        // 25 000 đ / 1M đơn vị vào, 1 credit = 25 đ: 1 000 đơn vị = 25 đ = đúng 1 credit
        jdbc.update("UPDATE ai_feature_prices SET input_price_vnd = 25000 WHERE feature = 'shadowing_feedback'");
        assertThat(creditService.charge(user, AiFeature.SHADOWING_FEEDBACK, 1000, 0)).isEqualTo(1);
        assertThat(creditService.charge(user, AiFeature.SHADOWING_FEEDBACK, 1100, 0)).isEqualTo(2);
        assertThat(balanceOf(user)).isEqualTo(100 - 1 - 1 - 2);
    }

    @Test
    void chargeIncludesOutputUnitsAtTheirOwnPrice() {
        UUID user = newUser();
        TestData.setCredits(jdbc, user, 100);
        jdbc.update("UPDATE ai_feature_prices SET input_price_vnd = 25000, output_price_vnd = 100000 "
                + "WHERE feature = 'shadowing_feedback'");

        // 1 000 vào = 25 đ, 1 000 ra = 100 đ: 125 đ / 25 = 5 credit
        assertThat(creditService.charge(user, AiFeature.SHADOWING_FEEDBACK, 1000, 1000)).isEqualTo(5);
    }

    @Test
    void chargeNeverGoesNegative() {
        UUID user = newUser();
        TestData.setCredits(jdbc, user, 1);

        assertThat(creditService.chargeFixed(user, AiFeature.TUTOR_SESSION, 3)).isEqualTo(1);

        assertThat(balanceOf(user)).isZero();
        assertThat(jdbc.queryForObject("SELECT credits_charged FROM ai_usage_logs WHERE user_id = ?",
                Integer.class, user)).isEqualTo(1);
    }

    @Test
    void successIsLoggedWithUnitsAndCredits() {
        UUID user = newUser();
        TestData.setCredits(jdbc, user, 50);

        creditService.charge(user, AiFeature.SHADOWING_FEEDBACK, 1234, 56);

        var row = jdbc.queryForMap("SELECT feature, status, input_units, output_units, credits_charged "
                + "FROM ai_usage_logs WHERE user_id = ?", user);
        assertThat(row).containsEntry("feature", "shadowing_feedback").containsEntry("status", "success")
                .containsEntry("input_units", 1234).containsEntry("output_units", 56)
                .containsEntry("credits_charged", 1);
    }

    @Test
    void failureIsLoggedNotCharged() {
        UUID user = newUser();
        TestData.setCredits(jdbc, user, 10);

        creditService.logFailure(user, AiFeature.SHADOWING_FEEDBACK, false);

        assertThat(logCount(user, "failed")).isEqualTo(1);
        assertThat(jdbc.queryForObject("SELECT credits_charged FROM ai_usage_logs WHERE user_id = ?",
                Integer.class, user)).isZero();
        assertThat(balanceOf(user)).isEqualTo(10);
    }

    @Test
    void proWalletUsesMonthlyCredits() {
        UUID user = newUser();
        TestData.grantPro(jdbc, user, 1);

        CreditBalance balance = creditService.balanceOf(user);

        assertThat(balance.balance()).isEqualTo(TestData.PRO_CREDITS_PER_MONTH);
        assertThat(balance.kind()).isEqualTo("pro");
        assertThat(balance.resetsAt()).isAfter(Instant.now());
    }

    @Test
    void buyingProAfterUsingFreeCreditsRefillsAtOnce() {
        UUID user = newUser();
        assertThat(creditService.balanceOf(user).balance()).isEqualTo(20); // ví Free, mốc đặt lại là nửa đêm
        TestData.grantPro(jdbc, user, 1, TestData.PRO_CREDITS_PER_MONTH, Instant.now()); // đơn mới, sau lần cập nhật ví

        assertThat(creditService.balanceOf(user).balance()).isEqualTo(TestData.PRO_CREDITS_PER_MONTH);
    }

    @Test
    void expiredProFallsBackToTheFreeDailyWallet() {
        UUID user = newUser();
        Instant start = Instant.now().minusSeconds(86400L * 40);
        TestData.grantPro(jdbc, user, 1, 500, start); // đã hết hạn cách đây khoảng 10 ngày
        insertWallet(user, 300, Instant.now().plusSeconds(86400L * 20));

        CreditBalance balance = creditService.balanceOf(user);

        assertThat(balance.kind()).isEqualTo("free");
        assertThat(balance.balance()).isEqualTo(20);
    }

    @Test
    void staffWalletIsNeverReset() {
        UUID teacher = newUser();
        jdbc.update("UPDATE users SET role = 'teacher' WHERE id = ?", teacher);
        jdbc.update("INSERT INTO ai_wallets (user_id, balance, resets_at) VALUES (?, 5, NULL)", teacher);

        CreditBalance balance = creditService.balanceOf(teacher);

        assertThat(balance.balance()).isEqualTo(5);
        assertThat(balance.resetsAt()).isNull();
        assertThat(balance.kind()).isEqualTo("staff");
    }

    private UUID newUser() {
        return userAccountService.createLocal("credit-" + UUID.randomUUID() + "@x.com", "Credit", "h").id();
    }

    private void insertWallet(UUID user, int balance, Instant resetsAt) {
        jdbc.update("INSERT INTO ai_wallets (user_id, balance, resets_at, updated_at) VALUES (?, ?, ?, ?)",
                user, balance, Timestamp.from(resetsAt), Timestamp.from(Instant.parse("2026-01-01T00:00:00Z")));
    }

    private int balanceOf(UUID user) {
        return jdbc.queryForObject("SELECT balance FROM ai_wallets WHERE user_id = ?", Integer.class, user);
    }

    private int logCount(UUID user, String status) {
        return jdbc.queryForObject("SELECT count(*) FROM ai_usage_logs WHERE user_id = ? AND status = ?",
                Integer.class, user, status);
    }
}
