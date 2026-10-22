package com.lingualoop.backend.subscription.service;

import java.time.Clock;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.lingualoop.backend.common.exception.BusinessException;
import com.lingualoop.backend.common.exception.ErrorCode;
import com.lingualoop.backend.config.UsageProperties;
import com.lingualoop.backend.subscription.dto.FeatureUsage;
import com.lingualoop.backend.subscription.dto.UsageTicket;
import com.lingualoop.backend.subscription.entity.PlanLimit;
import com.lingualoop.backend.subscription.entity.UsageCounter;
import com.lingualoop.backend.subscription.repository.PlanLimitRepository;
import com.lingualoop.backend.subscription.repository.UsageCounterRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
class UsageServiceImpl implements UsageService {

    /** Chu kỳ "none" (không reset) dùng một ngày cố định làm khoá bộ đếm. */
    private static final LocalDate NO_PERIOD = LocalDate.of(1970, 1, 1);

    private final UsageCounterRepository counters;
    private final PlanLimitRepository planLimits;
    private final SubscriptionQueryService subscriptionQueryService;
    private final Clock clock;
    private final UsageProperties properties;

    @Override
    @Transactional
    public UsageTicket tryConsume(UUID userId, String feature, int cost) {
        return tryConsume(userId, feature, cost, null);
    }

    @Override
    @Transactional
    public UsageTicket tryConsume(UUID userId, String feature, int cost, String action) {
        PlanLimit limit = limitOf(userId, feature).orElseThrow(() -> exceeded(feature, 0, action));
        Integer value = limit.getLimitValue();
        if (value != null && value < cost) {
            throw exceeded(feature, value, action);
        }
        LocalDate periodStart = periodStart(limit.getPeriod());

        // Không giới hạn vẫn đếm để thống kê. Có giới hạn: UPDATE chỉ tăng khi used + cost <= limit, nên hai yêu cầu cùng lúc
        // cho lượt cuối thì đúng một yêu cầu đổi được dòng (xem UsageCounterRepository).
        counters.createIfAbsent(userId, feature, periodStart);
        if (counters.incrementBelow(userId, feature, periodStart, value == null ? Integer.MAX_VALUE : value, cost) == 0) {
            throw exceeded(feature, value, action);
        }
        return new UsageTicket(feature, periodStart, cost);
    }

    @Override
    @Transactional
    public void refund(UUID userId, UsageTicket ticket) {
        counters.decrement(userId, ticket.feature(), ticket.periodStart(), ticket.cost());
    }

    @Override
    @Transactional(readOnly = true)
    public List<FeatureUsage> usageOf(UUID userId) {
        Map<String, Integer> used = new HashMap<>();
        for (UsageCounter c : counters.findByIdUserIdAndIdPeriodStartIn(userId,
                List.of(periodStart("day"), periodStart("month"), NO_PERIOD))) {
            used.put(c.getId().getFeature() + "|" + c.getId().getPeriodStart(), c.getUsed());
        }
        return planLimits.findByIdPlanOrderByIdFeature(planOf(userId)).stream()
                .map(l -> FeatureUsage.of(l.getId().getFeature(), l.getPeriod(), l.getLimitValue(),
                        used.getOrDefault(l.getId().getFeature() + "|" + periodStart(l.getPeriod()), 0)))
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public FeatureUsage usageOf(UUID userId, String feature) {
        return usageOf(userId).stream().filter(u -> u.feature().equals(feature)).findFirst()
                .orElseGet(() -> FeatureUsage.of(feature, "day", 0, 0));
    }

    private Optional<PlanLimit> limitOf(UUID userId, String feature) {
        return planLimits.findById(new PlanLimit.Key(planOf(userId), feature));
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

    private static BusinessException exceeded(String feature, Integer limit, String action) {
        Map<String, Object> details = new HashMap<>();
        details.put("feature", feature);
        details.put("limit", limit == null ? 0 : limit);
        if (action != null) {
            details.put("action", action);
        }
        return new BusinessException(ErrorCode.QUOTA_EXCEEDED, details);
    }
}
