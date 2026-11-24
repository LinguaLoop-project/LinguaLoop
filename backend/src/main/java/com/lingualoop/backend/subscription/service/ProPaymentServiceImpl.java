package com.lingualoop.backend.subscription.service;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;

import com.lingualoop.backend.common.exception.BusinessException;
import com.lingualoop.backend.common.exception.ErrorCode;
import com.lingualoop.backend.security.Role;
import com.lingualoop.backend.subscription.dto.CheckoutView;
import com.lingualoop.backend.subscription.dto.OrderView;
import com.lingualoop.backend.subscription.dto.PlanResponse;
import com.lingualoop.backend.subscription.dto.SalePlanView;
import com.lingualoop.backend.subscription.dto.request.CreateOrderRequest;
import com.lingualoop.backend.subscription.entity.ProPlan;
import com.lingualoop.backend.subscription.enums.OrderKind;
import com.lingualoop.backend.subscription.payment.VnpayGateway;
import com.lingualoop.backend.subscription.repository.ProOrderPaymentRepository;
import com.lingualoop.backend.subscription.repository.ProOrderPaymentRepository.OrderRow;
import com.lingualoop.backend.subscription.repository.ProPlanRepository;
import com.lingualoop.backend.user.dto.UserAccountView;
import com.lingualoop.backend.user.service.UserAccountService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Luồng nâng cấp, gia hạn và thanh toán gói Pro (UC-PR-01 đến 04, quy trình ở {@code docs/srs/PR-goi-pro}). Return URL
 * và IPN dùng chung {@link #confirm(Map)}; mọi thay đổi của một học viên chạy dưới khóa theo học viên nên mỗi đơn chỉ
 * được ghi nhận một lần (BR-PR-08).
 */
@Slf4j
@Service
@RequiredArgsConstructor
class ProPaymentServiceImpl implements ProPaymentService {

    /** Thời hạn giữ chỗ của đơn chờ thanh toán (BR-PR-12). */
    static final Duration HOLD = Duration.ofMinutes(15);
    /** Thời hạn gói tính theo lịch Việt Nam: mua ngày 10 thì hết hạn ngày 10 của tháng sau. */
    private static final ZoneId VN = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final DateTimeFormatter PAY_DATE = DateTimeFormatter.ofPattern("yyyyMMddHHmmss");
    private static final int HISTORY_LIMIT = 50;

    private final ProOrderPaymentRepository orders;
    private final ProPlanRepository plans;
    private final UserAccountService users;
    private final VnpayGateway vnpay;
    private final TransactionTemplate tx;
    private final Clock clock;

    @Override
    public PlanResponse myPlan(UUID userId) {
        return orders.currentPeriod(userId, clock.instant())
                .map(p -> PlanResponse.pro(p.startsAt(), p.endsAt()))
                .orElseGet(() -> PlanResponse.of(false));
    }

    @Override
    public List<SalePlanView> plansOnSale() {
        return plans.findAllByOnSaleTrueOrderByMonthsAscCreatedAtAsc().stream()
                .map(p -> new SalePlanView(p.getId(), p.getName(), p.getMonths(), p.getPriceVnd(),
                        p.getCreditsPerMonth()))
                .toList();
    }

    @Override
    public CheckoutView checkout(UUID userId, CreateOrderRequest request, String ipAddress) {
        UserAccountView user = users.findById(userId).orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND));
        if (user.role() != Role.STUDENT) {
            throw new BusinessException(ErrorCode.FORBIDDEN);
        }
        return Objects.requireNonNull(tx.execute(status -> {
            Instant now = clock.instant();
            orders.lockUser(userId);
            ProPlan plan = plans.findById(request.planId()).filter(ProPlan::isOnSale)
                    .orElseThrow(() -> new BusinessException(ErrorCode.PRO_PLAN_NOT_ON_SALE));
            boolean pro = orders.latestPaidEnd(userId, now).isPresent();
            if (request.kind() == OrderKind.upgrade && pro) {
                throw new BusinessException(ErrorCode.PRO_ALREADY_ACTIVE);
            }
            if (request.kind() == OrderKind.renew && !pro) {
                throw new BusinessException(ErrorCode.PRO_NOT_ACTIVE);
            }
            boolean free = plan.getPriceVnd() == 0;
            if (!free && !vnpay.configured()) {
                throw new BusinessException(ErrorCode.PAYMENT_UNAVAILABLE);
            }
            orders.cancelPending(userId, now);
            Instant expiresAt = now.plus(HOLD);
            UUID orderId = orders.insertPending(userId, plan.getId(), plan.getName(), plan.getMonths(),
                    plan.getCreditsPerMonth(), plan.getPriceVnd(), request.kind().name(), now, expiresAt);
            if (free) {
                // Gói 0 đồng: không có tiền nào cần thu, ghi nhận ngay như một thanh toán thành công
                activate(orders.find(orderId).orElseThrow(), now, null, null, null);
                return new CheckoutView(view(orders.find(orderId).orElseThrow()), null);
            }
            String url = vnpay.paymentUrl(new VnpayGateway.PaymentRequest(orderId, plan.getPriceVnd(),
                    "Thanh toan goi Pro LinguaLoop " + VnpayGateway.txnRefOf(orderId), ipAddress, now, expiresAt));
            return new CheckoutView(view(orders.find(orderId).orElseThrow()), url);
        }));
    }

    @Override
    public List<OrderView> orders(UUID userId) {
        return Objects.requireNonNull(tx.execute(status -> {
            orders.expireStale(userId, clock.instant());
            return orders.findByUser(userId, HISTORY_LIMIT).stream().map(ProPaymentServiceImpl::view).toList();
        }));
    }

    @Override
    public OrderView order(UUID userId, UUID orderId) {
        return Objects.requireNonNull(tx.execute(status -> {
            orders.expireStale(userId, clock.instant());
            return orders.find(orderId).filter(o -> o.userId().equals(userId)).map(ProPaymentServiceImpl::view)
                    .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND));
        }));
    }

    @Override
    public OrderView confirmReturn(UUID userId, Map<String, String> params) {
        Confirmation result = confirm(params);
        return switch (result.outcome()) {
            case INVALID_SIGNATURE, INVALID_AMOUNT -> throw new BusinessException(ErrorCode.PAYMENT_INVALID_RESULT);
            case ORDER_NOT_FOUND -> throw new BusinessException(ErrorCode.NOT_FOUND);
            case PROCESSED, ALREADY_CONFIRMED -> {
                if (!result.order().userId().equals(userId)) {
                    throw new BusinessException(ErrorCode.NOT_FOUND);
                }
                yield view(result.order());
            }
        };
    }

    @Override
    public Outcome confirmIpn(Map<String, String> params) {
        return confirm(params).outcome();
    }

    @Override
    public int expireStale() {
        return Objects.requireNonNull(tx.execute(status -> orders.expireStale(null, clock.instant())));
    }

    /** Kết quả xử lý kèm đơn sau khi xử lý (null khi không tìm được đơn hoặc sai chữ ký). */
    private record Confirmation(Outcome outcome, OrderRow order) {
    }

    /** Kiểm tra theo BR-PR-08 rồi đổi trạng thái đơn; dùng chung cho Return URL và IPN. */
    private Confirmation confirm(Map<String, String> params) {
        if (!vnpay.verify(params)) {
            return new Confirmation(Outcome.INVALID_SIGNATURE, null);
        }
        UUID orderId = VnpayGateway.orderIdOf(params.get("vnp_TxnRef"));
        OrderRow found = orderId == null ? null : orders.find(orderId).orElse(null);
        if (found == null) {
            return new Confirmation(Outcome.ORDER_NOT_FOUND, null);
        }
        return Objects.requireNonNull(tx.execute(status -> {
            orders.lockUser(found.userId());
            OrderRow order = orders.find(orderId).orElseThrow();
            if (!amountMatches(params.get("vnp_Amount"), order.amountVnd())) {
                return new Confirmation(Outcome.INVALID_AMOUNT, order);
            }
            if ("paid".equals(order.status()) || "failed".equals(order.status())) {
                return new Confirmation(Outcome.ALREADY_CONFIRMED, order);
            }
            Instant now = clock.instant();
            String code = params.get("vnp_ResponseCode");
            String transactionStatus = params.get("vnp_TransactionStatus");
            if (VnpayGateway.SUCCESS.equals(code)
                    && (transactionStatus == null || VnpayGateway.SUCCESS.equals(transactionStatus))) {
                activate(order, now, params.get("vnp_TransactionNo"), params.get("vnp_BankCode"),
                        payDate(params.get("vnp_PayDate")));
            } else if (VnpayGateway.CANCELED_BY_USER.equals(code)) {
                orders.markCanceled(order.id(), now, code);
            } else {
                orders.markFailed(order.id(), code);
            }
            return new Confirmation(Outcome.PROCESSED, orders.find(orderId).orElseThrow());
        }));
    }

    /**
     * Ghi nhận đơn đã thanh toán: học viên đang là Pro thì nối tiếp vào thời điểm kết thúc xa nhất (BR-PR-07,
     * BR-PR-17), ngược lại bắt đầu ngay (BR-PR-06). Credit của gói do ví tự nạp ở lần đọc kế tiếp (BR-GA-10).
     */
    private void activate(OrderRow order, Instant now, String transactionNo, String bankCode, Instant payDate) {
        Instant startsAt = orders.latestPaidEnd(order.userId(), now).orElse(now);
        Instant endsAt = startsAt.atZone(VN).plusMonths(order.months()).toInstant();
        orders.markPaid(order.id(), now, startsAt, endsAt, blankToNull(transactionNo), blankToNull(bankCode),
                payDate);
        log.info("Đơn Pro {} đã thanh toán, hiệu lực {} đến {}", order.id(), startsAt, endsAt);
    }

    private static boolean amountMatches(String vnpAmount, int amountVnd) {
        try {
            return vnpAmount != null && Long.parseLong(vnpAmount) == amountVnd * 100L;
        } catch (NumberFormatException e) {
            return false;
        }
    }

    /** {@code vnp_PayDate} theo giờ Việt Nam, dạng yyyyMMddHHmmss; sai dạng thì bỏ qua. */
    private static Instant payDate(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        try {
            return LocalDateTime.parse(value, PAY_DATE).atZone(VN).toInstant();
        } catch (DateTimeParseException e) {
            return null;
        }
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value;
    }

    private static OrderView view(OrderRow o) {
        return new OrderView(o.id(), o.planId(), o.planName(), o.months(), o.creditsPerMonth(), o.amountVnd(), o.kind(),
                o.status(), o.createdAt(), o.expiresAt(), o.paidAt(), o.startsAt(), o.endsAt(), o.transactionNo(),
                o.bankCode(), o.payDate(), o.responseCode());
    }
}
