package com.lingualoop.backend.credit;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;
import java.sql.Timestamp;
import java.time.Duration;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Map;
import java.util.UUID;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.JdbcTemplate;

import com.lingualoop.backend.TestcontainersConfiguration;
import com.lingualoop.backend.support.MutableClock;
import com.lingualoop.backend.support.TestClockConfiguration;
import com.lingualoop.backend.support.TestData;
import com.lingualoop.backend.user.service.UserAccountService;

/**
 * Chi phí phiên giọng nói (BR-GA-12, ADR 0013): trình duyệt nối thẳng tới Gemini Live nên chi phí được điền sau vào
 * chính dòng ghi lúc trừ credit, theo số token trình duyệt báo hoặc ước tính theo thời lượng. Đơn giá seed của phiên
 * gia sư và thực hành theo bài: 78.300 đồng vào, 313.200 đồng ra cho một triệu token; ước tính 32 vào, 16 ra mỗi giây.
 */
@SpringBootTest
@Import({TestcontainersConfiguration.class, TestClockConfiguration.class})
class LiveCostIntegrationTest {

    @Autowired private CreditService creditService;
    @Autowired private UserAccountService userAccountService;
    @Autowired private JdbcTemplate jdbc;
    @Autowired private MutableClock clock;

    private Instant now;

    @BeforeEach
    void pinClock() {
        now = Instant.now().truncatedTo(ChronoUnit.SECONDS);
        clock.fixAt(now);
    }

    @AfterEach
    void restore() {
        clock.reset();
    }

    @Test
    void reportedTokens_fillTheChargedRowOnce_withEstimatedCost() {
        UUID user = student();
        UUID session = UUID.randomUUID();
        creditService.charge(user, AiFeature.LESSON_CHAT, AiUsage.live(session));

        assertThat(creditService.recordLiveUsage(user, session, 1_000, 500)).isTrue();
        assertThat(creditService.recordLiveUsage(user, session, 9_000, 9_000)).isFalse(); // báo lại không ghi thêm

        Map<String, Object> row = row(session);
        assertThat(row).containsEntry("status", "success").containsEntry("credits_charged", 5)
                .containsEntry("input_units", 1_000).containsEntry("output_units", 500)
                .containsEntry("cost_estimated", true);
        // (1.000 × 78.300 + 500 × 313.200) / 1.000.000
        assertThat((BigDecimal) row.get("cost_vnd")).isEqualByComparingTo("234.90");
        assertThat(rowCount(session)).isEqualTo(1);
    }

    @Test
    void noTokensReported_estimatesByTimeSinceTheCharge() {
        UUID user = student();
        UUID session = UUID.randomUUID();
        creditService.charge(user, AiFeature.TUTOR_SESSION, AiUsage.live(session));
        startedAgo(session, Duration.ofSeconds(60));

        assertThat(creditService.recordLiveUsage(user, session, 0, 0)).isTrue();

        Map<String, Object> row = row(session);
        assertThat(row).containsEntry("input_units", 60 * 32).containsEntry("output_units", 60 * 16);
        // (1.920 × 78.300 + 960 × 313.200) / 1.000.000
        assertThat((BigDecimal) row.get("cost_vnd")).isEqualByComparingTo("451.01");
    }

    @Test
    void otherUsersSession_isIgnored() {
        UUID owner = student();
        UUID session = UUID.randomUUID();
        creditService.charge(owner, AiFeature.LESSON_CHAT, AiUsage.live(session));

        assertThat(creditService.recordLiveUsage(student(), session, 1_000, 500)).isFalse();
        assertThat(row(session)).containsEntry("input_units", 0).containsEntry("output_units", 0);
    }

    @Test
    void rejectedSessionStillRecordsTheTokensGeminiUsed() {
        UUID user = student();
        UUID session = UUID.randomUUID();
        creditService.logFailure(user, AiFeature.TUTOR_SESSION, true, session);

        assertThat(creditService.recordLiveUsage(user, session, 2_000, 0)).isTrue();

        assertThat(row(session)).containsEntry("status", "rejected_no_credit").containsEntry("credits_charged", 0)
                .containsEntry("input_units", 2_000);
    }

    @Test
    void unreportedSessions_areEstimatedAtTheMaximumDurationAfterTheGracePeriod() {
        UUID user = student();
        UUID tutor = UUID.randomUUID();
        UUID chat = UUID.randomUUID();
        UUID recent = UUID.randomUUID();
        UUID rejected = UUID.randomUUID();
        creditService.charge(user, AiFeature.TUTOR_SESSION, AiUsage.live(tutor));
        creditService.charge(user, AiFeature.LESSON_CHAT, AiUsage.live(chat));
        creditService.charge(user, AiFeature.LESSON_CHAT, AiUsage.live(recent));
        creditService.logFailure(user, AiFeature.TUTOR_SESSION, true, rejected);
        startedAgo(tutor, Duration.ofMinutes(21));
        startedAgo(chat, Duration.ofMinutes(21));
        startedAgo(recent, Duration.ofMinutes(10)); // còn chờ trình duyệt báo
        startedAgo(rejected, Duration.ofMinutes(21)); // không trừ credit: không ước tính theo thời lượng

        assertThat(creditService.estimateUnreportedLiveCosts()).isGreaterThanOrEqualTo(2);

        assertThat(row(tutor)).containsEntry("input_units", 630 * 32).containsEntry("output_units", 630 * 16);
        assertThat(row(chat)).containsEntry("input_units", 900 * 32).containsEntry("output_units", 900 * 16);
        assertThat(row(recent)).containsEntry("input_units", 0);
        assertThat(row(rejected)).containsEntry("input_units", 0);
        // Đã ước tính thì trình duyệt báo muộn cũng không ghi đè
        assertThat(creditService.recordLiveUsage(user, tutor, 1, 1)).isFalse();
    }

    private UUID student() {
        UUID user = userAccountService.createLocal("live-" + UUID.randomUUID() + "@x.com", "Live", "h").id();
        TestData.setCredits(jdbc, user, 50);
        return user;
    }

    private void startedAgo(UUID session, Duration ago) {
        jdbc.update("UPDATE ai_usage_logs SET created_at = ? WHERE session_id = ?", Timestamp.from(now.minus(ago)),
                session);
    }

    private Map<String, Object> row(UUID session) {
        return jdbc.queryForMap("SELECT status, credits_charged, input_units, output_units, cost_vnd, cost_estimated "
                + "FROM ai_usage_logs WHERE session_id = ?", session);
    }

    private int rowCount(UUID session) {
        return jdbc.queryForObject("SELECT count(*) FROM ai_usage_logs WHERE session_id = ?", Integer.class, session);
    }
}
