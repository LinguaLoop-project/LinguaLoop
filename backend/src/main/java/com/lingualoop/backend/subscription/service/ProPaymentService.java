package com.lingualoop.backend.subscription.service;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import com.lingualoop.backend.subscription.dto.CheckoutView;
import com.lingualoop.backend.subscription.dto.OrderView;
import com.lingualoop.backend.subscription.dto.PlanResponse;
import com.lingualoop.backend.subscription.dto.SalePlanView;
import com.lingualoop.backend.subscription.dto.request.CreateOrderRequest;

/** Xem gói, nâng cấp, gia hạn và thanh toán gói Pro qua VNPAY (UC-PR-01 đến 04). */
public interface ProPaymentService {

    /** Kết quả xử lý một thông báo kết quả của VNPAY. */
    enum Outcome {
        /** Đã xử lý: đơn vừa đổi trạng thái hoặc kết quả không làm đổi gì. */
        PROCESSED,
        /** Đơn đã ở trạng thái cuối (Đã thanh toán, Thất bại) trước đó. */
        ALREADY_CONFIRMED,
        INVALID_SIGNATURE,
        ORDER_NOT_FOUND,
        INVALID_AMOUNT
    }

    PlanResponse myPlan(UUID userId);

    List<SalePlanView> plansOnSale();

    /**
     * Tạo đơn chờ thanh toán và đường dẫn VNPAY. Hủy đơn chờ cũ (BR-PR-16); kiểm gói đang bán (BR-PR-05) và đúng loại
     * người dùng (BR-PR-01).
     */
    CheckoutView checkout(UUID userId, CreateOrderRequest request, String ipAddress);

    /** Lịch sử đơn của chính học viên (BR-PR-03). */
    List<OrderView> orders(UUID userId);

    /** Một đơn của chính học viên; đơn của người khác báo không tìm thấy (BR-PR-03). */
    OrderView order(UUID userId, UUID orderId);

    /**
     * Kết quả VNPAY mà trình duyệt mang về qua Return URL: kiểm chữ ký rồi ghi nhận như IPN (BR-PR-08), trả đơn sau khi
     * xử lý.
     *
     * @throws com.lingualoop.backend.common.exception.BusinessException {@code PAYMENT_INVALID_RESULT} khi sai chữ ký
     *         hoặc số tiền; {@code NOT_FOUND} khi đơn không tồn tại hoặc không phải của học viên
     */
    OrderView confirmReturn(UUID userId, Map<String, String> params);

    /** Thông báo IPN từ máy chủ VNPAY. Không ném lỗi nghiệp vụ, trả kết quả để controller dịch sang mã của VNPAY. */
    Outcome confirmIpn(Map<String, String> params);

    /** Chuyển các đơn chờ quá 15 phút sang Hết hạn (BR-PR-12); trả số đơn đã chuyển. */
    int expireStale();
}
