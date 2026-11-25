package com.lingualoop.backend.subscription.payment;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.security.InvalidKeyException;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.HexFormat;
import java.util.Locale;
import java.util.Map;
import java.util.TreeMap;
import java.util.UUID;
import java.util.stream.Collectors;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

import org.springframework.stereotype.Component;

import com.lingualoop.backend.config.VnpayProperties;

import lombok.RequiredArgsConstructor;

/**
 * Tạo đường dẫn thanh toán và kiểm chữ ký kết quả của VNPAY (phiên bản API 2.1.0). Chữ ký là HMAC-SHA512 trên chuỗi
 * các tham số {@code vnp_*} khác rỗng, sắp theo tên, mỗi giá trị mã hóa URL kiểu form (dấu cách thành {@code +}),
 * khớp code mẫu Java của VNPAY.
 */
@Component
@RequiredArgsConstructor
public class VnpayGateway {

    public static final String SUCCESS = "00";
    public static final String CANCELED_BY_USER = "24";

    /** VNPAY đọc mọi mốc thời gian theo giờ Việt Nam (GMT+7). */
    private static final ZoneId VN = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final DateTimeFormatter TIME = DateTimeFormatter.ofPattern("yyyyMMddHHmmss").withZone(VN);
    private static final String HASH = "vnp_SecureHash";
    private static final String HASH_TYPE = "vnp_SecureHashType";

    private final VnpayProperties properties;

    /** Một yêu cầu thanh toán: {@code amountVnd} là số tiền thật, VNPAY nhận số này nhân 100. */
    public record PaymentRequest(UUID orderId, long amountVnd, String orderInfo, String ipAddress, Instant createdAt,
            Instant expiresAt) {
    }

    public boolean configured() {
        return properties.configured();
    }

    public String paymentUrl(PaymentRequest request) {
        Map<String, String> params = new TreeMap<>();
        params.put("vnp_Version", "2.1.0");
        params.put("vnp_Command", "pay");
        params.put("vnp_TmnCode", properties.tmnCode());
        params.put("vnp_Amount", String.valueOf(request.amountVnd() * 100));
        params.put("vnp_CurrCode", "VND");
        params.put("vnp_TxnRef", txnRefOf(request.orderId()));
        params.put("vnp_OrderInfo", request.orderInfo());
        params.put("vnp_OrderType", "other");
        params.put("vnp_Locale", "vn");
        params.put("vnp_ReturnUrl", properties.returnUrl());
        params.put("vnp_IpAddr", request.ipAddress());
        params.put("vnp_CreateDate", TIME.format(request.createdAt()));
        params.put("vnp_ExpireDate", TIME.format(request.expiresAt()));
        String query = canonical(params);
        return properties.url() + "?" + query + "&" + HASH + "=" + sign(query);
    }

    /** Chữ ký {@code vnp_SecureHash} khớp các tham số {@code vnp_*} còn lại (BR-PR-08). */
    public boolean verify(Map<String, String> params) {
        String received = params.get(HASH);
        if (received == null || received.isBlank() || !configured()) {
            return false;
        }
        Map<String, String> signed = new TreeMap<>();
        params.forEach((key, value) -> {
            if (key.startsWith("vnp_") && !key.equals(HASH) && !key.equals(HASH_TYPE)) {
                signed.put(key, value);
            }
        });
        byte[] expected = sign(canonical(signed)).getBytes(StandardCharsets.US_ASCII);
        byte[] actual = received.toLowerCase(Locale.ROOT).getBytes(StandardCharsets.US_ASCII);
        return MessageDigest.isEqual(expected, actual);
    }

    /** Mã tham chiếu gửi VNPAY: id đơn bỏ dấu gạch ngang. */
    public static String txnRefOf(UUID orderId) {
        return orderId.toString().replace("-", "");
    }

    /** Id đơn từ {@code vnp_TxnRef}; null khi không đúng dạng 32 ký tự hex. */
    public static UUID orderIdOf(String txnRef) {
        if (txnRef == null || !txnRef.matches("[0-9a-fA-F]{32}")) {
            return null;
        }
        return UUID.fromString(txnRef.replaceFirst("(.{8})(.{4})(.{4})(.{4})(.{12})", "$1-$2-$3-$4-$5"));
    }

    /** Chuỗi ký: {@code key=value} nối bằng {@code &}, theo thứ tự tên, bỏ giá trị rỗng. */
    static String canonical(Map<String, String> sorted) {
        return sorted.entrySet().stream()
                .filter(e -> e.getValue() != null && !e.getValue().isEmpty())
                .map(e -> encode(e.getKey()) + "=" + encode(e.getValue()))
                .collect(Collectors.joining("&"));
    }

    String sign(String data) {
        try {
            Mac mac = Mac.getInstance("HmacSHA512");
            mac.init(new SecretKeySpec(properties.hashSecret().getBytes(StandardCharsets.UTF_8), "HmacSHA512"));
            return HexFormat.of().formatHex(mac.doFinal(data.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException | InvalidKeyException e) {
            throw new IllegalStateException("Không ký được yêu cầu VNPAY", e);
        }
    }

    private static String encode(String value) {
        return URLEncoder.encode(value, StandardCharsets.US_ASCII);
    }
}
