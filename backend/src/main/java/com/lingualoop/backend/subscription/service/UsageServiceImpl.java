package com.lingualoop.backend.subscription.service;

import java.time.Clock;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.lingualoop.backend.common.exception.BusinessException;
import com.lingualoop.backend.common.exception.ErrorCode;
import com.lingualoop.backend.config.UsageProperties;
import com.lingualoop.backend.subscription.dto.FeatureUsage;
import com.lingualoop.backend.subscription.dto.UsageTicket;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
class UsageServiceImpl implements UsageService {

    /** Chu kỳ "none" (không reset) dùng một ngày cố định làm khoá bộ đếm. */
    private static final LocalDate NO_PERIOD = LocalDate.of(1970, 1, 1);

    private final JdbcClient jdbc;
    private final SubscriptionQueryService subscriptionQueryService;
    private final Clock clock;
    private final UsageProperties properties;

    private record Limit(String period, Integer value) {
    }

    @Override
    @Transactional
    public UsageTicket tryConsume(UUID userId, String feature) {
        Limit limit = limitOf(userId, feature).orElseThrow(() -> exceeded(feature, 0));
        if (limit.value() != null && limit.value() <= 0) {
            throw exceeded(feature, limit.value());
        }
        LocalDate periodStart = periodStart(limit.period());

        // Không giới hạn vẫn đếm để thống kê. Có giới hạn: chỉ tăng khi used < limit, nên hai yêu cầu cùng lúc
        // cho lượt cuối thì đúng một yêu cầu có dòng trả về.
        boolean granted;
        if (limit.value() == null) {
            granted = jdbc.sql("""
                    INSERT INTO usage_counters (user_id, feature, period_start, used) VALUES (:u, :f, :d, 1)
                    ON CONFLICT (user_id, feature, period_start)
                    DO UPDATE SET used = usage_counters.used + 1
                    RETURNING used""")
                    .param("u", userId).param("f", feature).param("d", periodStart)
                    .query(Integer.class).optional().isPresent();
        } else {
            granted = jdbc.sql("""
                    INSERT INTO usage_counters (user_id, feature, period_start, used) VALUES (:u, :f, :d, 1)
                    ON CONFLICT (user_id, feature, period_start)
                    DO UPDATE SET used = usage_counters.used + 1
                    WHERE usage_counters.used < :limit
                    RETURNING used""")
                    .param("u", userId).param("f", feature).param("d", periodStart).param("limit", limit.value())
                    .query(Integer.class).optional().isPresent();
        }
        if (!granted) {
            throw exceeded(feature, limit.value());
        }
        return new UsageTicket(feature, periodStart);
    }

    @Override
    @Transactional
    public void refund(UUID userId, UsageTicket ticket) {
        jdbc.sql("""
                UPDATE usage_counters SET used = GREATEST(used - 1, 0)
                WHERE user_id = :u AND feature = :f AND period_start = :d""")
                .param("u", userId).param("f", ticket.feature()).param("d", ticket.periodStart())
                .update();
    }

    @Override
    @Transactional(readOnly = true)
    public List<FeatureUsage> usageOf(UUID userId) {
        Map<String, Integer> used = new HashMap<>();
        jdbc.sql("""
                SELECT feature, period_start, used FROM usage_counters
                WHERE user_id = :u AND period_start IN (:day, :month, :none)""")
                .param("u", userId)
                .param("day", periodStart("day")).param("month", periodStart("month")).param("none", NO_PERIOD)
                .query((rs, n) -> {
                    used.put(rs.getString("feature") + "|" + rs.getObject("period_start", LocalDate.class),
                            rs.getInt("used"));
                    return null;
                })
                .list();
        return jdbc.sql("SELECT feature, period, limit_value FROM plan_limits WHERE plan = :p ORDER BY feature")
                .param("p", planOf(userId))
                .query((rs, n) -> {
                    String feature = rs.getString("feature");
                    String period = rs.getString("period");
                    Integer limit = (Integer) rs.getObject("limit_value");
                    return FeatureUsage.of(feature, period, limit, used.getOrDefault(feature + "|" + periodStart(period), 0));
                })
                .list();
    }

    @Override
    @Transactional(readOnly = true)
    public FeatureUsage usageOf(UUID userId, String feature) {
        return usageOf(userId).stream().filter(u -> u.feature().equals(feature)).findFirst()
                .orElseGet(() -> FeatureUsage.of(feature, "day", 0, 0));
    }

    private Optional<Limit> limitOf(UUID userId, String feature) {
        return jdbc.sql("SELECT period, limit_value FROM plan_limits WHERE plan = :p AND feature = :f")
                .param("p", planOf(userId)).param("f", feature)
                .query((rs, n) -> new Limit(rs.getString("period"), (Integer) rs.getObject("limit_value")))
                .optional();
    }

    private String planOf(UUID userId) {
        return subscriptionQueryService.isPro(userId) ? "pro" : "free";
    }

    private LocalDate periodStart(String period) {
        LocalDate today = LocalDate.ofInstant(clock.instant(), properties.zone());
        return switch (period) {
            case "day" -> today;
            case "month" -> today.withDayOfMonth(1);
            default -> NO_PERIOD;
        };
    }

    private static BusinessException exceeded(String feature, Integer limit) {
        return new BusinessException(ErrorCode.QUOTA_EXCEEDED,
                Map.of("feature", feature, "limit", limit == null ? 0 : limit));
    }
}
