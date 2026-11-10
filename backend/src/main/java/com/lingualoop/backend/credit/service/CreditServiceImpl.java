package com.lingualoop.backend.credit.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Clock;
import java.time.Instant;
import java.time.ZonedDateTime;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;

import com.lingualoop.backend.common.exception.BusinessException;
import com.lingualoop.backend.common.exception.ErrorCode;
import com.lingualoop.backend.config.CreditProperties;
import com.lingualoop.backend.credit.AiFeature;
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

    private record Rejection(int balance, int minBalance) {
    }

    @Override
    public void requireCanStart(UUID userId, AiFeature feature) {
        Rejection rejection = tx.execute(status -> {
            Refreshed refreshed = refresh(userId);
            int min = settings().getMinBalanceToStart();
            int balance = refreshed.wallet().getBalance();
            if (balance >= min) {
                return null;
            }
            logs.save(AiUsageLog.of(userId, feature.dbValue(), AiUsageLog.REJECTED_NO_CREDIT, 0, 0, 0));
            return new Rejection(balance, min);
        });
        if (rejection != null) {
            throw new BusinessException(ErrorCode.QUOTA_EXCEEDED, Map.of("feature", feature.dbValue(),
                    "balance", rejection.balance(), "minBalance", rejection.minBalance()));
        }
    }

    @Override
    public int charge(UUID userId, AiFeature feature, long inputUnits, long outputUnits) {
        return deduct(userId, feature, inputUnits, outputUnits, null);
    }

    @Override
    public int chargeFixed(UUID userId, AiFeature feature, int credits) {
        return deduct(userId, feature, 0, 0, credits);
    }

    @Override
    public void logFailure(UUID userId, AiFeature feature, boolean rejectedNoCredit) {
        tx.executeWithoutResult(status -> logs.save(AiUsageLog.of(userId, feature.dbValue(),
                rejectedNoCredit ? AiUsageLog.REJECTED_NO_CREDIT : AiUsageLog.FAILED, 0, 0, 0)));
    }

    @Override
    public CreditBalance balanceOf(UUID userId) {
        return tx.execute(status -> {
            Refreshed refreshed = refresh(userId);
            return new CreditBalance(refreshed.wallet().getBalance(), refreshed.wallet().getResetsAt(),
                    refreshed.kind());
        });
    }

    private int deduct(UUID userId, AiFeature feature, long inputUnits, long outputUnits, Integer fixedCost) {
        Integer charged = tx.execute(status -> {
            AiWallet wallet = refresh(userId).wallet();
            int cost = fixedCost != null ? fixedCost : costOf(feature, inputUnits, outputUnits);
            int paid = wallet.deduct(cost, clock.instant());
            logs.save(AiUsageLog.of(userId, feature.dbValue(), AiUsageLog.SUCCESS, clamp(inputUnits),
                    clamp(outputUnits), paid));
            return paid;
        });
        return charged == null ? 0 : charged;
    }

    /** {@code ceil((in*priceIn + out*priceOut) / 1e6 / creditValueVnd)}, tối thiểu 1 (BR-GA-06). */
    private int costOf(AiFeature feature, long inputUnits, long outputUnits) {
        AiFeaturePrice price = prices.findById(feature.dbValue()).orElseThrow();
        BigDecimal vnd = BigDecimal.valueOf(inputUnits).multiply(BigDecimal.valueOf(price.getInputPriceVnd()))
                .add(BigDecimal.valueOf(outputUnits).multiply(BigDecimal.valueOf(price.getOutputPriceVnd())));
        BigDecimal divisor = UNITS_PER_PRICE.multiply(BigDecimal.valueOf(settings().getCreditValueVnd()));
        BigDecimal credits = vnd.divide(divisor, 0, RoundingMode.CEILING);
        return (int) Math.max(1, Math.min(credits.longValue(), Integer.MAX_VALUE));
    }

    private AiSettings settings() {
        return settingsRepository.findById(AiSettings.ID).orElseThrow();
    }

    /**
     * Khoá ví (tạo nếu chưa có) và nạp lại khi đến hạn (lazy, BR-GA-03, BR-GA-10). Giáo viên và quản trị viên không đặt
     * lại. Phải gọi trong giao dịch.
     */
    private Refreshed refresh(UUID userId) {
        Instant now = clock.instant();
        wallets.createIfAbsent(userId, now);
        AiWallet wallet = wallets.findForUpdate(userId).orElseThrow();

        Role role = users.findById(userId).map(UserAccountView::role).orElse(Role.STUDENT);
        if (role != Role.STUDENT) {
            return new Refreshed(wallet, "staff");
        }

        Instant nextMidnight = nextMidnight(now);
        boolean expired = wallet.getResetsAt() == null || !wallet.getResetsAt().isAfter(now);
        Optional<ActiveProOrder> pro = subscriptions.activeOrder(userId);
        if (pro.isPresent()) {
            ActiveProOrder order = pro.get();
            // Vừa mua Pro: ví còn mốc đặt lại của Free nên nạp ngay theo gói
            if (expired || wallet.getUpdatedAt().isBefore(order.startsAt())) {
                wallet.refill(order.creditsPerMonth(), nextMonthly(order, now), now);
            }
            return new Refreshed(wallet, "pro");
        }
        // Hết hạn Pro: mốc đặt lại tháng còn xa hơn nửa đêm nay thì chuyển về chu kỳ ngày của Free
        if (expired || wallet.getResetsAt().isAfter(nextMidnight)) {
            wallet.refill(settings().getFreeDailyCredits(), nextMidnight, now);
        }
        return new Refreshed(wallet, "free");
    }

    private Instant nextMidnight(Instant now) {
        return now.atZone(properties.zone()).toLocalDate().plusDays(1).atStartOfDay(properties.zone()).toInstant();
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
