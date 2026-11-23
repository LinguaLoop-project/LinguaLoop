package com.lingualoop.backend.credit.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZonedDateTime;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;

import com.lingualoop.backend.common.exception.BusinessException;
import com.lingualoop.backend.common.exception.ErrorCode;
import com.lingualoop.backend.config.CreditProperties;
import com.lingualoop.backend.credit.AiFeature;
import com.lingualoop.backend.credit.AiUsage;
import com.lingualoop.backend.credit.CreditService;
import com.lingualoop.backend.credit.dto.CreditBalance;
import com.lingualoop.backend.credit.entity.AiFeaturePrice;
import com.lingualoop.backend.credit.entity.AiSettings;
import com.lingualoop.backend.credit.entity.AiUsageLog;
import com.lingualoop.backend.credit.entity.AiWallet;
import com.lingualoop.backend.credit.repository.AiFeaturePriceRepository;
import com.lingualoop.backend.credit.repository.AiSettingsRepository;
import com.lingualoop.backend.credit.repository.AiUsageLogRepository;
import com.lingualoop.backend.credit.repository.AiWalletRepository;
import com.lingualoop.backend.security.Role;
import com.lingualoop.backend.subscription.dto.ActiveProOrder;
import com.lingualoop.backend.subscription.service.SubscriptionQueryService;
import com.lingualoop.backend.user.dto.UserAccountView;
import com.lingualoop.backend.user.service.UserAccountService;

import lombok.RequiredArgsConstructor;

/**
 * Ví credit AI (BR-GA). Mọi thao tác chạy trong một giao dịch có khoá dòng ví ({@code FOR UPDATE}), nên hai yêu cầu
 * đồng thời không trừ vượt số dư. Dùng {@link TransactionTemplate} thay cho {@code @Transactional} để lỗi
 * {@code QUOTA_EXCEEDED} được ném sau khi nhật ký từ chối đã commit.
 */
@Service
@RequiredArgsConstructor
class CreditServiceImpl implements CreditService {

    private static final BigDecimal UNITS_PER_PRICE = BigDecimal.valueOf(1_000_000L);
    private static final Duration LONGEST_LIVE_SESSION = Duration.ofMinutes(15);
    /** Chặn trên số đơn vị trình duyệt báo cho một phiên, để số sai không làm lệch thống kê quá mức. */
    static final long MAX_REPORTED_UNITS = 50_000_000L;
    private static final int SWEEP_BATCH = 200;

    private final AiWalletRepository wallets;
    private final AiSettingsRepository settingsRepository;
    private final AiFeaturePriceRepository prices;
    private final AiUsageLogRepository logs;
    private final SubscriptionQueryService subscriptions;
    private final UserAccountService users;
    private final CreditProperties properties;
    private final TransactionTemplate tx;
    private final Clock clock;

    /** Ví đã làm mới kèm loại ví. */
    private record Refreshed(AiWallet wallet, String kind) {
    }

    @Override
    public int priceOf(AiFeature feature) {
        return price(feature).getCreditsPerUse();
    }

    @Override
    public Map<AiFeature, Integer> prices() {
        Map<AiFeature, Integer> result = new EnumMap<>(AiFeature.class);
        for (AiFeature feature : AiFeature.values()) {
            result.put(feature, priceOf(feature));
        }
        return result;
    }

    @Override
    public void requireCanStart(UUID userId, AiFeature feature) {
        requireCanStart(userId, feature, 1);
    }

    @Override
    public void requireCanStart(UUID userId, AiFeature feature, int quantity) {
        int cost = priceOf(feature) * Math.max(1, quantity);
        Integer shortBalance = tx.execute(status -> {
            int balance = refresh(userId).wallet().getBalance();
            if (balance >= cost) {
                return null;
            }
            logs.save(AiUsageLog.of(userId, feature.dbValue(), AiUsageLog.REJECTED_NO_CREDIT));
            return balance;
        });
        if (shortBalance != null) {
            throw new BusinessException(ErrorCode.QUOTA_EXCEEDED,
                    Map.of("feature", feature.dbValue(), "balance", shortBalance, "cost", cost));
        }
    }

    @Override
    public int charge(UUID userId, AiFeature feature, AiUsage usage) {
        // Lambda luôn trả về số (không null) nên execute không trả null
        return Objects.requireNonNull(tx.execute(status -> {
            AiWallet wallet = refresh(userId).wallet();
            AiFeaturePrice price = price(feature);
            int paid = wallet.deduct(price.getCreditsPerUse() * usage.quantity(), clock.instant());
            logs.save(log(userId, feature, AiUsageLog.SUCCESS, usage, paid, price));
            return paid;
        }));
    }

    @Override
    public void recordCost(UUID userId, AiFeature feature, AiUsage usage) {
        tx.executeWithoutResult(status ->
                logs.save(log(userId, feature, AiUsageLog.EXTRA_COST, usage, 0, price(feature))));
    }

    @Override
    public void logFailure(UUID userId, AiFeature feature, boolean rejectedNoCredit) {
        tx.executeWithoutResult(status -> logs.save(AiUsageLog.of(userId, feature.dbValue(),
                rejectedNoCredit ? AiUsageLog.REJECTED_NO_CREDIT : AiUsageLog.FAILED)));
    }

    @Override
    public void logFailedCost(UUID userId, AiFeature feature, AiUsage usage) {
        tx.executeWithoutResult(status ->
                logs.save(log(userId, feature, AiUsageLog.FAILED, usage, 0, price(feature))));
    }

    @Override
    public void logFailure(UUID userId, AiFeature feature, boolean rejectedNoCredit, UUID liveSessionId) {
        AiUsage usage = AiUsage.live(liveSessionId);
        tx.executeWithoutResult(status -> logs.save(log(userId, feature,
                rejectedNoCredit ? AiUsageLog.REJECTED_NO_CREDIT : AiUsageLog.FAILED, usage, 0, price(feature))));
    }

    @Override
    public boolean recordLiveUsage(UUID userId, UUID sessionId, long inputUnits, long outputUnits) {
        return Boolean.TRUE.equals(tx.execute(status -> logs.findLivePendingForUpdate(userId, sessionId).map(row -> {
            if (inputUnits <= 0 && outputUnits <= 0) {
                Duration ran = Duration.between(row.getCreatedAt(), clock.instant());
                fillEstimate(row, ran);
            } else {
                fill(row, inputUnits, outputUnits);
            }
            return true;
        }).orElse(false)));
    }

    @Override
    public int estimateUnreportedLiveCosts() {
        Instant cutoff = clock.instant().minus(LONGEST_LIVE_SESSION).minus(properties.liveEstimate().reportGrace());
        return Objects.requireNonNull(tx.execute(status -> {
            List<AiUsageLog> stale = logs.lockStaleLivePending(cutoff, SWEEP_BATCH);
            // Không biết phiên kết thúc lúc nào: tính đủ thời lượng tối đa của tính năng
            stale.forEach(row -> fillEstimate(row, maxLiveDuration(row.getFeature())));
            return stale.size();
        }));
    }

    /** Ước tính theo thời lượng (BR-GA-12), không vượt thời lượng tối đa của phiên. */
    private void fillEstimate(AiUsageLog row, Duration ran) {
        Duration max = maxLiveDuration(row.getFeature());
        long seconds = Math.max(1, Math.min(ran.toSeconds(), max.toSeconds()));
        CreditProperties.LiveEstimate rate = properties.liveEstimate();
        fill(row, seconds * rate.inputUnitsPerSecond(), seconds * rate.outputUnitsPerSecond());
    }

    private void fill(AiUsageLog row, long inputUnits, long outputUnits) {
        AiFeaturePrice price = prices.findById(row.getFeature()).orElseThrow();
        long in = Math.min(inputUnits, MAX_REPORTED_UNITS);
        long out = Math.min(outputUnits, MAX_REPORTED_UNITS);
        BigDecimal cost = costOf(new AiUsage(1, in, out, null, true, row.getSessionId()), price);
        row.fillLiveCost(clamp(in), clamp(out), cost);
    }

    /** Thời lượng tối đa của phiên giọng nói kèm dung sai: phiên gia sư 10 phút (BR-AI-15), theo bài 15 phút (BR-AI-11). */
    static Duration maxLiveDuration(String feature) {
        return AiFeature.TUTOR_SESSION.dbValue().equals(feature) ? Duration.ofSeconds(630) : LONGEST_LIVE_SESSION;
    }

    @Override
    public CreditBalance balanceOf(UUID userId) {
        return tx.execute(status -> {
            Refreshed refreshed = refresh(userId);
            return new CreditBalance(refreshed.wallet().getBalance(), refreshed.wallet().getResetsAt(),
                    refreshed.kind());
        });
    }

    @Override
    public void resetForRoleChange(UUID userId) {
        wallets.resetBalance(userId, clock.instant());
    }

    @Override
    public int grant(UUID userId, int credits) {
        Instant now = clock.instant();
        wallets.createIfAbsent(userId, now);
        AiWallet wallet = wallets.findForUpdate(userId).orElseThrow();
        wallet.add(credits, now);
        return wallet.getBalance();
    }

    private static AiUsageLog log(UUID userId, AiFeature feature, String status, AiUsage usage, int credits,
            AiFeaturePrice price) {
        return AiUsageLog.of(userId, feature.dbValue(), status, usage.quantity(), clamp(usage.inputUnits()),
                clamp(usage.outputUnits()), credits, costOf(usage, price), usage.model(), usage.estimated())
                .forSession(usage.sessionId());
    }

    /**
     * Chi phí thật (đồng, BR-GA-12): {@code (in*giáVào + out*giáRa) / 1e6 + chi phí cố định mỗi lần}, làm tròn 2 chữ số.
     * Phiên giọng nói lúc trừ credit chưa có số đơn vị xử lý nên phần theo đơn vị bằng 0 cho tới khi được điền.
     */
    static BigDecimal costOf(AiUsage usage, AiFeaturePrice price) {
        BigDecimal byUnits = BigDecimal.valueOf(usage.inputUnits()).multiply(BigDecimal.valueOf(price.getInputPriceVnd()))
                .add(BigDecimal.valueOf(usage.outputUnits()).multiply(BigDecimal.valueOf(price.getOutputPriceVnd())))
                .divide(UNITS_PER_PRICE, 2, RoundingMode.HALF_UP);
        return byUnits.add(BigDecimal.valueOf(price.getFixedCostVnd()));
    }

    private AiFeaturePrice price(AiFeature feature) {
        return prices.findById(feature.dbValue()).orElseThrow();
    }

    private AiSettings settings() {
        return settingsRepository.findById(AiSettings.SINGLETON_ID).orElseThrow();
    }

    /**
     * Khoá ví (tạo nếu chưa có) và cập nhật theo gói (lazy, không cần job, BR-GA-03, BR-GA-10). Phải gọi trong giao dịch.
     * <ul>
     * <li>Giáo viên, quản trị viên: không đặt lại; không bao giờ được tặng credit dùng thử.</li>
     * <li>Pro còn hạn: nạp credit tháng của gói khi đến mốc hoặc vừa kích hoạt; credit dùng thử còn lại bị bỏ.</li>
     * <li>Free chưa được tặng: tặng một lần credit dùng thử, không có mốc đặt lại.</li>
     * <li>Free có mốc đặt lại đã qua (gói Pro vừa hết hạn): số dư về 0, không tặng lại.</li>
     * </ul>
     */
    private Refreshed refresh(UUID userId) {
        Instant now = clock.instant();
        wallets.createIfAbsent(userId, now);
        AiWallet wallet = wallets.findForUpdate(userId).orElseThrow();

        Role role = users.findById(userId).map(UserAccountView::role).orElse(Role.STUDENT);
        if (role != Role.STUDENT) {
            wallet.closeTrial(now);
            return new Refreshed(wallet, "staff");
        }

        boolean expired = wallet.getResetsAt() == null || !wallet.getResetsAt().isAfter(now);
        Optional<ActiveProOrder> pro = subscriptions.activeOrder(userId);
        if (pro.isPresent()) {
            ActiveProOrder order = pro.get();
            // Vừa mua Pro (ví Free không có mốc đặt lại) hoặc đến mốc tháng: nạp theo gói, bỏ credit dùng thử còn lại
            if (expired || wallet.getUpdatedAt().isBefore(order.startsAt())) {
                wallet.refill(order.creditsPerMonth(), nextMonthly(order, now), now);
            }
            wallet.closeTrial(now);
            return new Refreshed(wallet, "pro");
        }
        if (wallet.getTrialGrantedAt() == null) {
            wallet.grantTrial(settings().getTrialCredits(), now);
        } else if (wallet.getResetsAt() != null && expired) {
            // Gói Pro vừa hết hạn: credit của gói không còn dùng được, không tặng lại credit dùng thử
            wallet.refill(0, null, now);
        }
        return new Refreshed(wallet, "free");
    }

    /** Mốc tháng kế tiếp tính từ ngày bắt đầu đơn (BR-GA-10), không quá ngày hết hạn đơn. */
    private Instant nextMonthly(ActiveProOrder order, Instant now) {
        ZonedDateTime start = order.startsAt().atZone(properties.zone());
        int k = 1;
        ZonedDateTime next = start.plusMonths(k);
        while (!next.toInstant().isAfter(now)) {
            next = start.plusMonths(++k);
        }
        return next.toInstant().isBefore(order.endsAt()) ? next.toInstant() : order.endsAt();
    }

    private static int clamp(long units) {
        return (int) Math.max(0, Math.min(units, Integer.MAX_VALUE));
    }
}
