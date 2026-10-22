package com.lingualoop.backend.subscription.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Duration;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.atomic.AtomicInteger;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpHeaders;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;

import com.lingualoop.backend.TestcontainersConfiguration;
import com.lingualoop.backend.common.exception.BusinessException;
import com.lingualoop.backend.common.exception.ErrorCode;
import com.lingualoop.backend.security.JwtTokenService;
import com.lingualoop.backend.security.Role;
import com.lingualoop.backend.subscription.constant.AiAction;
import com.lingualoop.backend.subscription.dto.UsageTicket;
import com.lingualoop.backend.support.MutableClock;
import com.lingualoop.backend.support.TestClockConfiguration;
import com.lingualoop.backend.user.service.UserAccountService;

/** Bể năng lượng AI theo gói và theo ngày (BR-QUOTA-01, UC-SHADOW-04): xem mức dùng, giá, trả lại, sang ngày mới. */
@SpringBootTest
@AutoConfigureMockMvc
@Import({TestcontainersConfiguration.class, TestClockConfiguration.class})
class AiEnergyUsageIntegrationTest {

    private static final String FEATURE = AiAction.FEATURE;
    private static final int FEEDBACK = AiAction.AI_FEEDBACK.cost();
    private static final int TUTOR = AiAction.TUTOR_SESSION.cost();

    @Autowired private MockMvc mockMvc;
    @Autowired private UsageService usageService;
    @Autowired private JwtTokenService jwtTokenService;
    @Autowired private UserAccountService userAccountService;
    @Autowired private JdbcTemplate jdbc;
    @Autowired private MutableClock clock;

    @AfterEach
    void resetClock() {
        clock.reset();
    }

    @Test
    void usage_reportsEnergyByPlanAndTheCostTable_AC_SHADOW_17() throws Exception {
        UUID free = newUser();
        UUID pro = newUser();
        jdbc.update("INSERT INTO user_subscriptions (user_id, status, expires_at) "
                + "VALUES (?, 'active', now() + interval '10 days')", pro);
        usageService.tryConsume(free, FEATURE, FEEDBACK);
        usageService.tryConsume(free, FEATURE, TUTOR);

        mockMvc.perform(get("/api/v1/me/usage").header(HttpHeaders.AUTHORIZATION, bearer(free)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.features[?(@.feature=='ai_energy')].used").value(FEEDBACK + TUTOR))
                .andExpect(jsonPath("$.data.features[?(@.feature=='ai_energy')].limit").value(8))
                .andExpect(jsonPath("$.data.features[?(@.feature=='ai_energy')].remaining").value(8 - FEEDBACK - TUTOR))
                // ba bộ đếm cũ đã gộp vào bể năng lượng; cổng video khẩu hình của Free vẫn tắt
                .andExpect(jsonPath("$.data.features[?(@.feature=='shadowing_assess')]").isEmpty())
                .andExpect(jsonPath("$.data.features[?(@.feature=='ai_feedback')]").isEmpty())
                .andExpect(jsonPath("$.data.features[?(@.feature=='tutor_session')]").isEmpty())
                .andExpect(jsonPath("$.data.features[?(@.feature=='mouth_video')].limit").value(0))
                .andExpect(jsonPath("$.data.costs.ai_feedback").value(1))
                .andExpect(jsonPath("$.data.costs.tutor_session").value(3));

        mockMvc.perform(get("/api/v1/me/usage").header(HttpHeaders.AUTHORIZATION, bearer(pro)))
                .andExpect(jsonPath("$.data.features[?(@.feature=='ai_energy')].limit").value((Object) null))
                .andExpect(jsonPath("$.data.features[?(@.feature=='ai_energy')].remaining").value((Object) null))
                .andExpect(jsonPath("$.data.features[?(@.feature=='mouth_video')].limit").value((Object) null));
    }

    @Test
    void proEnergy_isUnlimitedButStillCounted_AC_SHADOW_17() {
        UUID pro = newUser();
        jdbc.update("INSERT INTO user_subscriptions (user_id, status, expires_at) "
                + "VALUES (?, 'active', now() + interval '10 days')", pro);

        for (int i = 0; i < 5; i++) {
            usageService.tryConsume(pro, FEATURE, TUTOR);
        }

        assertThat(usageService.usageOf(pro, FEATURE).used()).isEqualTo(5 * TUTOR);
        assertThat(usageService.usageOf(pro, FEATURE).remaining()).isNull();
    }

    @Test
    void featureNotAllowedOnPlan_isRejected() {
        UUID free = newUser();
        assertThatThrownBy(() -> usageService.tryConsume(free, "weakness_full", 1))
                .isInstanceOfSatisfying(BusinessException.class,
                        e -> assertThat(e.getErrorCode()).isEqualTo(ErrorCode.QUOTA_EXCEEDED));
    }

    @Test
    void costLargerThanWhatIsLeft_isRejectedAndLeavesTheCounterUntouched_BR_QUOTA_01() {
        UUID free = newUser();
        usageService.tryConsume(free, FEATURE, 6); // còn 2

        assertThatThrownBy(() -> usageService.tryConsume(free, FEATURE, TUTOR, AiAction.TUTOR_SESSION.action()))
                .isInstanceOfSatisfying(BusinessException.class, e -> {
                    assertThat(e.getErrorCode()).isEqualTo(ErrorCode.QUOTA_EXCEEDED);
                    assertThat(e.getDetails()).containsEntry("feature", FEATURE).containsEntry("limit", 8)
                            .containsEntry("action", "tutor_session");
                });

        assertThat(usageService.usageOf(free, FEATURE).used()).isEqualTo(6);
        // phần còn lại vẫn đủ cho hoạt động rẻ hơn
        usageService.tryConsume(free, FEATURE, FEEDBACK);
        usageService.tryConsume(free, FEATURE, FEEDBACK);
        assertThat(usageService.usageOf(free, FEATURE).remaining()).isZero();
    }

    @Test
    void refund_returnsTheWholeCostAndNeverGoesBelowZero() {
        UUID free = newUser();
        UsageTicket ticket = usageService.tryConsume(free, FEATURE, TUTOR);
        assertThat(usageService.usageOf(free, FEATURE).used()).isEqualTo(TUTOR);

        usageService.refund(free, ticket);
        usageService.refund(free, ticket);

        assertThat(usageService.usageOf(free, FEATURE).used()).isZero();
    }

    @Test
    void concurrentRequestsWithMixedCosts_neverExceedTheDailyLimit_AC_SHADOW_17() throws Exception {
        UUID free = newUser();
        int requests = 14;
        ExecutorService pool = Executors.newFixedThreadPool(requests);
        CountDownLatch start = new CountDownLatch(1);
        AtomicInteger grantedCost = new AtomicInteger();
        List<Integer> rejectedCosts = Collections.synchronizedList(new ArrayList<>());
        try {
            List<Future<?>> futures = new ArrayList<>();
            for (int i = 0; i < requests; i++) {
                int cost = i % 2 == 0 ? TUTOR : FEEDBACK;
                futures.add(pool.submit(() -> {
                    start.await();
                    try {
                        usageService.tryConsume(free, FEATURE, cost);
                        grantedCost.addAndGet(cost);
                    } catch (BusinessException e) {
                        assertThat(e.getErrorCode()).isEqualTo(ErrorCode.QUOTA_EXCEEDED);
                        rejectedCosts.add(cost);
                    }
                    return null;
                }));
            }
            start.countDown();
            for (Future<?> f : futures) {
                f.get();
            }
        } finally {
            pool.shutdownNow();
        }

        int used = usageService.usageOf(free, FEATURE).used();
        // 7 yêu cầu giá 3 và 7 yêu cầu giá 1 (tổng 28) không thể cùng vào 8 năng lượng
        assertThat(used).isLessThanOrEqualTo(8).isEqualTo(grantedCost.get());
        assertThat(rejectedCosts).isNotEmpty();
        // bộ đếm không bao giờ giảm nên yêu cầu bị từ chối thật sự không còn chỗ ở mức cuối
        assertThat(rejectedCosts).allSatisfy(cost -> assertThat(used + cost).isGreaterThan(8));
    }

    @Test
    void newDay_startsFromZeroInVietnamTime_AC_SHADOW_18() {
        UUID free = newUser();
        usageService.tryConsume(free, FEATURE, 8);
        assertThatThrownBy(() -> usageService.tryConsume(free, FEATURE, FEEDBACK))
                .isInstanceOfSatisfying(BusinessException.class,
                        e -> assertThat(e.getErrorCode()).isEqualTo(ErrorCode.QUOTA_EXCEEDED));

        clock.advance(Duration.ofHours(24));

        assertThat(usageService.usageOf(free, FEATURE).used()).isZero();
        assertThat(usageService.tryConsume(free, FEATURE, TUTOR)).isNotNull();
        assertThat(usageService.usageOf(free, FEATURE).remaining()).isEqualTo(8 - TUTOR);
    }

    @Test
    void refundAfterDayChange_hitsTheOriginalPeriod() {
        UUID free = newUser();
        UsageTicket ticket = usageService.tryConsume(free, FEATURE, TUTOR);
        clock.advance(Duration.ofHours(24));
        usageService.tryConsume(free, FEATURE, FEEDBACK);

        usageService.refund(free, ticket);

        assertThat(usageService.usageOf(free, FEATURE).used()).isEqualTo(FEEDBACK);
    }

    private UUID newUser() {
        return userAccountService.createLocal("us-" + UUID.randomUUID() + "@x.com", "Us", "h").id();
    }

    private String bearer(UUID user) {
        return "Bearer " + jwtTokenService.issueAccessToken(user, Role.STUDENT, UUID.randomUUID()).token();
    }
}
