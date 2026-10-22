package com.lingualoop.backend.subscription.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Duration;
import java.util.ArrayList;
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
import com.lingualoop.backend.subscription.dto.UsageTicket;
import com.lingualoop.backend.support.MutableClock;
import com.lingualoop.backend.support.TestClockConfiguration;
import com.lingualoop.backend.user.service.UserAccountService;

/** Hạn mức theo gói và theo ngày (UC-SHADOW-04): xem mức dùng, trả lượt, sang ngày mới. */
@SpringBootTest
@AutoConfigureMockMvc
@Import({TestcontainersConfiguration.class, TestClockConfiguration.class})
class ShadowingUsageIntegrationTest {

    private static final String FEATURE = "shadowing_assess";

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
    void usage_reportsLimitsByPlan_AC_SHADOW_17() throws Exception {
        UUID free = newUser();
        UUID pro = newUser();
        jdbc.update("INSERT INTO user_subscriptions (user_id, status, expires_at) "
                + "VALUES (?, 'active', now() + interval '10 days')", pro);
        usageService.tryConsume(free, FEATURE);
        usageService.tryConsume(free, FEATURE);

        mockMvc.perform(get("/api/v1/me/usage").header(HttpHeaders.AUTHORIZATION, bearer(free)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.features[?(@.feature=='shadowing_assess')].used").value(2))
                .andExpect(jsonPath("$.data.features[?(@.feature=='shadowing_assess')].limit").value(5))
                .andExpect(jsonPath("$.data.features[?(@.feature=='shadowing_assess')].remaining").value(3))
                .andExpect(jsonPath("$.data.features[?(@.feature=='mouth_video')].limit").value(0));

        mockMvc.perform(get("/api/v1/me/usage").header(HttpHeaders.AUTHORIZATION, bearer(pro)))
                .andExpect(jsonPath("$.data.features[?(@.feature=='shadowing_assess')].limit").value(200))
                .andExpect(jsonPath("$.data.features[?(@.feature=='shadowing_assess')].used").value(0))
                // gói Pro không giới hạn video khẩu hình: limit và remaining rỗng
                .andExpect(jsonPath("$.data.features[?(@.feature=='mouth_video')].limit").value((Object) null))
                .andExpect(jsonPath("$.data.features[?(@.feature=='mouth_video')].remaining").value((Object) null));
    }

    @Test
    void unlimitedFeature_isStillCounted_AC_SHADOW_17() {
        UUID pro = newUser();
        jdbc.update("INSERT INTO user_subscriptions (user_id, status, expires_at) "
                + "VALUES (?, 'active', now() + interval '10 days')", pro);

        usageService.tryConsume(pro, "mouth_video");
        usageService.tryConsume(pro, "mouth_video");

        assertThat(usageService.usageOf(pro, "mouth_video").used()).isEqualTo(2);
        assertThat(usageService.usageOf(pro, "mouth_video").remaining()).isNull();
    }

    @Test
    void featureNotAllowedOnPlan_isRejected() {
        UUID free = newUser();
        assertThatThrownBy(() -> usageService.tryConsume(free, "weakness_full"))
                .isInstanceOfSatisfying(BusinessException.class,
                        e -> assertThat(e.getErrorCode()).isEqualTo(ErrorCode.QUOTA_EXCEEDED));
    }

    @Test
    void refund_returnsOneAttemptAndNeverGoesBelowZero() {
        UUID free = newUser();
        UsageTicket ticket = usageService.tryConsume(free, FEATURE);

        usageService.refund(free, ticket);
        usageService.refund(free, ticket);

        assertThat(usageService.usageOf(free, FEATURE).used()).isZero();
    }

    @Test
    void concurrentRequests_neverExceedTheDailyLimit_AC_SHADOW_17() throws Exception {
        UUID free = newUser();
        int requests = 12;
        ExecutorService pool = Executors.newFixedThreadPool(requests);
        CountDownLatch start = new CountDownLatch(1);
        AtomicInteger granted = new AtomicInteger();
        AtomicInteger rejected = new AtomicInteger();
        try {
            List<Future<?>> futures = new ArrayList<>();
            for (int i = 0; i < requests; i++) {
                futures.add(pool.submit(() -> {
                    start.await();
                    try {
                        usageService.tryConsume(free, FEATURE);
                        granted.incrementAndGet();
                    } catch (BusinessException e) {
                        assertThat(e.getErrorCode()).isEqualTo(ErrorCode.QUOTA_EXCEEDED);
                        rejected.incrementAndGet();
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

        // gói Free có 5 lượt mỗi ngày: đúng 5 yêu cầu được lượt, 7 yêu cầu còn lại bị từ chối
        assertThat(granted.get()).isEqualTo(5);
        assertThat(rejected.get()).isEqualTo(requests - 5);
        assertThat(usageService.usageOf(free, FEATURE).used()).isEqualTo(5);
    }

    @Test
    void newDay_startsFromZeroInVietnamTime_AC_SHADOW_18() {
        UUID free = newUser();
        for (int i = 0; i < 5; i++) {
            usageService.tryConsume(free, FEATURE);
        }
        assertThatThrownBy(() -> usageService.tryConsume(free, FEATURE))
                .isInstanceOfSatisfying(BusinessException.class,
                        e -> assertThat(e.getErrorCode()).isEqualTo(ErrorCode.QUOTA_EXCEEDED));

        clock.advance(Duration.ofHours(24));

        assertThat(usageService.usageOf(free, FEATURE).used()).isZero();
        assertThat(usageService.tryConsume(free, FEATURE)).isNotNull();
        assertThat(usageService.usageOf(free, FEATURE).remaining()).isEqualTo(4);
    }

    @Test
    void refundAfterDayChange_hitsTheOriginalPeriod() {
        UUID free = newUser();
        UsageTicket ticket = usageService.tryConsume(free, FEATURE);
        clock.advance(Duration.ofHours(24));
        usageService.tryConsume(free, FEATURE);

        usageService.refund(free, ticket);

        assertThat(usageService.usageOf(free, FEATURE).used()).isEqualTo(1);
    }

    private UUID newUser() {
        return userAccountService.createLocal("us-" + UUID.randomUUID() + "@x.com", "Us", "h").id();
    }

    private String bearer(UUID user) {
        return "Bearer " + jwtTokenService.issueAccessToken(user, Role.STUDENT, UUID.randomUUID()).token();
    }
}
