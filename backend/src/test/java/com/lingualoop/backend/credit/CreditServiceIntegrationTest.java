package com.lingualoop.backend.credit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.math.BigDecimal;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.support.TransactionTemplate;

import com.lingualoop.backend.TestcontainersConfiguration;
import com.lingualoop.backend.common.exception.BusinessException;
import com.lingualoop.backend.common.exception.ErrorCode;
import com.lingualoop.backend.credit.dto.CreditBalance;
import com.lingualoop.backend.support.MutableClock;
import com.lingualoop.backend.support.TestClockConfiguration;
import com.lingualoop.backend.support.TestData;
import com.lingualoop.backend.user.service.UserAccountService;

/**
 * Ví credit: tặng credit dùng thử một lần, nạp theo gói Pro, trừ credit cố định theo đơn vị, không âm, ghi chi phí
 * thật (BR-GA-03, BR-GA-04, BR-GA-06, BR-GA-10, BR-GA-12, ADR 0013).
 */
@SpringBootTest
@Import({TestcontainersConfiguration.class, TestClockConfiguration.class})
class CreditServiceIntegrationTest {

    @Autowired private CreditService creditService;
    @Autowired private UserAccountService userAccountService;
    @Autowired private JdbcTemplate jdbc;
    @Autowired private MutableClock clock;
    @Autowired private TransactionTemplate tx;

    /** Trả hàng nhận xét AI về giá trị seed của migration {@code V20261121_1000}. */
    @AfterEach
    void restore() {
        clock.reset();
        jdbc.update("UPDATE ai_feature_prices SET credits_per_use = 2, input_price_vnd = 19575, output_price_vnd = 97875 "
                + "WHERE feature = 'shadowing_feedback'");
    }

    /** AC-AI-29, BR-GA-03: tặng một lần, không đặt lại, hết thì không tặng lại. */
    @Test
    void newStudentGetsTheTrialCreditsOnceAndNeverAgain() {
        UUID user = newUser();

        CreditBalance first = creditService.balanceOf(user);
        assertThat(first.balance()).isEqualTo(100);
        assertThat(first.kind()).isEqualTo("free");
        assertThat(first.resetsAt()).isNull();

        jdbc.update("UPDATE ai_wallets SET balance = 0 WHERE user_id = ?", user);
        clock.fixAt(Instant.now().plusSeconds(86400L * 3)); // vài ngày sau
        assertThatThrownBy(() -> creditService.requireCanStart(user, AiFeature.SHADOWING_FEEDBACK))
                .isInstanceOfSatisfying(BusinessException.class, e -> {
                    assertThat(e.getErrorCode()).isEqualTo(ErrorCode.QUOTA_EXCEEDED);
                    assertThat(e.getDetails()).containsEntry("balance", 0).containsEntry("cost", 2);
                });
        assertThat(balanceOf(user)).isZero();
    }

    /** AC-GA-04: số credit dùng thử mới chỉ áp dụng cho học viên được tặng sau khi sửa. */
    @Test
    void changedTrialAmountAppliesOnlyToLaterStudents() {
        UUID before = newUser();
        assertThat(creditService.balanceOf(before).balance()).isEqualTo(100);
        try {
            jdbc.update("UPDATE ai_settings SET trial_credits = 150 WHERE id = 1");
            UUID after = newUser();
            assertThat(creditService.balanceOf(after).balance()).isEqualTo(150);
            assertThat(creditService.balanceOf(before).balance()).isEqualTo(100);
        } finally {
            jdbc.update("UPDATE ai_settings SET trial_credits = 100 WHERE id = 1");
        }
    }

    @Test
    void seededPricesFollowTheBusinessUnits() {
        assertThat(creditService.prices()).containsExactly(
                Map.entry(AiFeature.SHADOWING_FEEDBACK, 2),
                Map.entry(AiFeature.LESSON_CHAT, 5),
                Map.entry(AiFeature.TUTOR_SESSION, 3),
                Map.entry(AiFeature.LESSON_SUGGEST, 1),
                Map.entry(AiFeature.LESSON_IMPORT, 10));
    }

    @Test
    void rejectionIsLogged() {
        UUID user = newUser();
        TestData.setCredits(jdbc, user, 4);

        assertThatThrownBy(() -> creditService.requireCanStart(user, AiFeature.LESSON_CHAT)) // cần 5
                .isInstanceOf(BusinessException.class);

        assertThat(logCount(user, "rejected_no_credit")).isEqualTo(1);
        assertThat(balanceOf(user)).isEqualTo(4);
    }

    /** AC-TK-75: hết credit thì báo một lần mỗi ngày, tắt loại này thì không báo. */
    @Test
    void rejectionNotifiesOncePerDay_unlessTheLearnerTurnedItOff_AC_TK_75() {
        UUID user = newUser();
        TestData.setCredits(jdbc, user, 0);

        for (int i = 0; i < 3; i++) {
            assertThatThrownBy(() -> creditService.requireCanStart(user, AiFeature.LESSON_CHAT))
                    .isInstanceOf(BusinessException.class);
        }
        assertThat(jdbc.queryForObject("SELECT count(*) FROM notifications WHERE user_id = ? "
                + "AND type = 'AI_CREDIT_EXHAUSTED'", Long.class, user)).isEqualTo(1);

        UUID muted = newUser();
        TestData.setCredits(jdbc, muted, 0);
        jdbc.update("INSERT INTO notification_preferences (user_id, type, enabled) VALUES (?, 'AI_CREDIT_EXHAUSTED', false)",
                muted);
        assertThatThrownBy(() -> creditService.requireCanStart(muted, AiFeature.LESSON_CHAT))
                .isInstanceOf(BusinessException.class);
        assertThat(jdbc.queryForObject("SELECT count(*) FROM notifications WHERE user_id = ?", Long.class, muted))
                .isZero();
    }

    /** AC-BH-72: số dư phải đủ cho mọi câu đã chọn, không chỉ một câu. */
    @Test
    void requireCanStartChecksEveryUnit() {
        UUID user = newUser();
        TestData.setCredits(jdbc, user, 15);

        assertThatThrownBy(() -> creditService.requireCanStart(user, AiFeature.LESSON_SUGGEST, 20))
                .isInstanceOfSatisfying(BusinessException.class,
                        e -> assertThat(e.getDetails()).containsEntry("balance", 15).containsEntry("cost", 20));
        creditService.requireCanStart(user, AiFeature.LESSON_SUGGEST, 15);
        assertThat(balanceOf(user)).isEqualTo(15);
    }

    @Test
    void chargeIsTheFixedPriceTimesQuantityWhateverTheTokens() {
        UUID user = newUser();
        TestData.setCredits(jdbc, user, 100);

        assertThat(creditService.charge(user, AiFeature.SHADOWING_FEEDBACK, AiUsage.tokens(50_000, 50_000, "m")))
                .isEqualTo(2);
        assertThat(creditService.charge(user, AiFeature.SHADOWING_FEEDBACK, AiUsage.tokens(10, 10, "m")))
                .isEqualTo(2);
        assertThat(creditService.charge(user, AiFeature.LESSON_SUGGEST, AiUsage.units(14, 3000, 900, null)))
                .isEqualTo(14);
        assertThat(balanceOf(user)).isEqualTo(100 - 2 - 2 - 14);
    }

    /** AC-GA-05: mức credit mới áp dụng cho lần dùng sau, lần đã ghi giữ nguyên. */
    @Test
    void newPriceAppliesOnlyToLaterUses() {
        UUID user = newUser();
        TestData.setCredits(jdbc, user, 20);
        creditService.charge(user, AiFeature.SHADOWING_FEEDBACK, AiUsage.tokens(1, 1, "m"));

        jdbc.update("UPDATE ai_feature_prices SET credits_per_use = 3 WHERE feature = 'shadowing_feedback'");
        assertThat(creditService.priceOf(AiFeature.SHADOWING_FEEDBACK)).isEqualTo(3);
        creditService.charge(user, AiFeature.SHADOWING_FEEDBACK, AiUsage.tokens(1, 1, "m"));

        assertThat(jdbc.queryForList("SELECT credits_charged FROM ai_usage_logs WHERE user_id = ? ORDER BY id",
                Integer.class, user)).containsExactly(2, 3);
        assertThat(balanceOf(user)).isEqualTo(15);
    }

    @Test
    void chargeNeverGoesNegative() {
        UUID user = newUser();
        TestData.setCredits(jdbc, user, 1);

        assertThat(creditService.charge(user, AiFeature.TUTOR_SESSION, AiUsage.live(UUID.randomUUID()))).isEqualTo(1);

        assertThat(balanceOf(user)).isZero();
        assertThat(jdbc.queryForObject("SELECT credits_charged FROM ai_usage_logs WHERE user_id = ?",
                Integer.class, user)).isEqualTo(1);
    }

    /** BR-GA-12, AC-GA-44: chi phí thật theo đơn giá lúc dùng, tách khỏi credit trừ. */
    @Test
    void successIsLoggedWithUnitsCreditsAndRealCost() {
        UUID user = newUser();
        TestData.setCredits(jdbc, user, 50);

        creditService.charge(user, AiFeature.SHADOWING_FEEDBACK, AiUsage.tokens(1200, 250, "gemini-test"));
        jdbc.update("UPDATE ai_feature_prices SET input_price_vnd = 39150, output_price_vnd = 195750 "
                + "WHERE feature = 'shadowing_feedback'");
        creditService.charge(user, AiFeature.SHADOWING_FEEDBACK, AiUsage.tokens(1200, 250, "gemini-test"));

        var rows = jdbc.queryForList("SELECT feature, status, quantity, input_units, output_units, credits_charged, "
                + "cost_vnd, model, cost_estimated FROM ai_usage_logs WHERE user_id = ? ORDER BY id", user);
        assertThat(rows.get(0)).containsEntry("feature", "shadowing_feedback").containsEntry("status", "success")
                .containsEntry("quantity", 1).containsEntry("input_units", 1200).containsEntry("output_units", 250)
                .containsEntry("credits_charged", 2).containsEntry("model", "gemini-test")
                .containsEntry("cost_estimated", false);
        assertThat((BigDecimal) rows.get(0).get("cost_vnd")).isEqualByComparingTo("47.96");
        assertThat((BigDecimal) rows.get(1).get("cost_vnd")).isEqualByComparingTo("95.92");
        assertThat(rows.get(1)).containsEntry("credits_charged", 2);
    }

    @Test
    void fixedCostAndLiveEstimateAreLogged() {
        UUID user = newUser();
        TestData.setCredits(jdbc, user, 50);

        creditService.charge(user, AiFeature.LESSON_IMPORT, AiUsage.once());
        creditService.charge(user, AiFeature.TUTOR_SESSION, AiUsage.live(UUID.randomUUID()));

        var rows = jdbc.queryForList("SELECT feature, credits_charged, cost_vnd, cost_estimated FROM ai_usage_logs "
                + "WHERE user_id = ? ORDER BY id", user);
        assertThat(rows.get(0)).containsEntry("feature", "lesson_import").containsEntry("credits_charged", 10)
                .containsEntry("cost_estimated", false);
        assertThat((BigDecimal) rows.get(0).get("cost_vnd")).isEqualByComparingTo("131");
        assertThat(rows.get(1)).containsEntry("feature", "tutor_session").containsEntry("credits_charged", 3)
                .containsEntry("cost_estimated", true);
        assertThat(balanceOf(user)).isEqualTo(50 - 10 - 3);
    }

    @Test
    void extraCostIsLoggedWithoutCharging() {
        UUID user = newUser();
        TestData.setCredits(jdbc, user, 10);

        creditService.recordCost(user, AiFeature.LESSON_CHAT, AiUsage.tokens(1_000_000, 0, null));

        assertThat(logCount(user, "extra_cost")).isEqualTo(1);
        assertThat(jdbc.queryForObject("SELECT credits_charged FROM ai_usage_logs WHERE user_id = ?",
                Integer.class, user)).isZero();
        assertThat(jdbc.queryForObject("SELECT cost_vnd FROM ai_usage_logs WHERE user_id = ?",
                BigDecimal.class, user)).isEqualByComparingTo("78300");
        assertThat(balanceOf(user)).isEqualTo(10);
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

    /** BR-GA-03: kích hoạt Pro thì bỏ credit dùng thử còn lại, số dư bằng credit tháng của gói. */
    @Test
    void buyingProReplacesTheRemainingTrialCredits() {
        UUID user = newUser();
        assertThat(creditService.balanceOf(user).balance()).isEqualTo(100);
        jdbc.update("UPDATE ai_wallets SET balance = 20 WHERE user_id = ?", user);
        TestData.grantPro(jdbc, user, 1, TestData.PRO_CREDITS_PER_MONTH, Instant.now()); // đơn mới, sau lần cập nhật ví

        CreditBalance balance = creditService.balanceOf(user);

        assertThat(balance.balance()).isEqualTo(TestData.PRO_CREDITS_PER_MONTH);
        assertThat(balance.kind()).isEqualTo("pro");
        assertThat(balance.resetsAt()).isAfter(Instant.now());
    }

    /** BR-GA-03, BR-GA-10: gói hết hạn thì số dư về 0 và không được tặng credit dùng thử. */
    @Test
    void expiredProLeavesAnEmptyWalletWithoutTrial() {
        UUID user = newUser();
        Instant start = Instant.now().minusSeconds(86400L * 40);
        TestData.grantPro(jdbc, user, 1, 500, start); // đã hết hạn cách đây khoảng 10 ngày
        insertWallet(user, 300, start.plusSeconds(86400L * 30)); // mốc tháng của gói, đã qua

        CreditBalance balance = creditService.balanceOf(user);

        assertThat(balance.kind()).isEqualTo("free");
        assertThat(balance.balance()).isZero();
        assertThat(balance.resetsAt()).isNull();
        assertThat(creditService.balanceOf(user).balance()).isZero();
    }

    /** BR-GA-03, BR-QT-04: tài khoản đổi từ giáo viên sang học viên không được tặng credit dùng thử. */
    @Test
    void teacherTurnedStudentGetsNoTrial() {
        UUID user = newUser();
        jdbc.update("UPDATE users SET role = 'teacher' WHERE id = ?", user);
        assertThat(creditService.balanceOf(user).kind()).isEqualTo("staff");

        jdbc.update("UPDATE users SET role = 'student' WHERE id = ?", user);
        // Chạy trong giao dịch của nghiệp vụ đổi vai trò như ở UserAdminService
        tx.executeWithoutResult(status -> creditService.resetForRoleChange(user));

        assertThat(creditService.balanceOf(user).balance()).isZero();
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

    /** Ví đã qua thời gian dùng thử (đã kích hoạt Pro trước đó). */
    private void insertWallet(UUID user, int balance, Instant resetsAt) {
        Timestamp longAgo = Timestamp.from(Instant.parse("2026-01-01T00:00:00Z"));
        jdbc.update("INSERT INTO ai_wallets (user_id, balance, resets_at, updated_at, trial_granted_at) "
                + "VALUES (?, ?, ?, ?, ?)", user, balance, Timestamp.from(resetsAt), longAgo, longAgo);
    }

    private int balanceOf(UUID user) {
        return jdbc.queryForObject("SELECT balance FROM ai_wallets WHERE user_id = ?", Integer.class, user);
    }

    private int logCount(UUID user, String status) {
        return jdbc.queryForObject("SELECT count(*) FROM ai_usage_logs WHERE user_id = ? AND status = ?",
                Integer.class, user, status);
    }
}
