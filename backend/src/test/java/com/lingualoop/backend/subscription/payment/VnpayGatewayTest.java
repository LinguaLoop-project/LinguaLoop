package com.lingualoop.backend.subscription.payment;

import static org.assertj.core.api.Assertions.assertThat;

import java.net.URI;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.TreeMap;
import java.util.UUID;

import org.junit.jupiter.api.Test;

import com.lingualoop.backend.config.VnpayProperties;

/** Ký và kiểm chữ ký VNPAY (BR-PR-08, AC-PR-17). */
class VnpayGatewayTest {

    private static final VnpayProperties PROPS = new VnpayProperties(
            "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html", "TESTTMN", "TESTSECRET",
            "http://localhost:5173/payment/vnpay-return");

    private final VnpayGateway gateway = new VnpayGateway(PROPS);

    @Test
    void canonical_sortsByNameEncodesFormStyleAndSkipsEmpty() {
        Map<String, String> params = new TreeMap<>(Map.of("vnp_b", "x y", "vnp_a", "1", "vnp_c", ""));
        assertThat(VnpayGateway.canonical(params)).isEqualTo("vnp_a=1&vnp_b=x+y");
    }

    @Test
    void sign_isHmacSha512Hex() {
        // Tính độc lập bằng Python: hmac.new(b'TESTSECRET', b'vnp_a=1&vnp_b=x+y', hashlib.sha512).hexdigest()
        assertThat(gateway.sign("vnp_a=1&vnp_b=x+y")).isEqualTo(
                "ba3d848bb475cb60587f14f9185e5186a2349c1d304fa4a6850f325beb0c2d79"
                        + "ec5f82d5c5c85acd3461562cc008c79a3cbc5794a69382a972a7a60d4869ef92");
    }

    @Test
    void paymentUrl_carriesAmountTimesHundredVietnamTimesAndAValidSignature() {
        UUID orderId = UUID.fromString("0b9c1c1e-7f1d-4c55-9a51-2a3b4c5d6e7f");
        Instant created = Instant.parse("2026-11-24T03:00:00Z");
        String url = gateway.paymentUrl(new VnpayGateway.PaymentRequest(orderId, 99_000, "Thanh toan goi Pro",
                "127.0.0.1", created, created.plusSeconds(900)));

        assertThat(url).startsWith(PROPS.url() + "?");
        Map<String, String> params = query(url);
        assertThat(params).containsEntry("vnp_Amount", "9900000")
                .containsEntry("vnp_TxnRef", "0b9c1c1e7f1d4c559a512a3b4c5d6e7f")
                .containsEntry("vnp_TmnCode", "TESTTMN")
                .containsEntry("vnp_CreateDate", "20261124100000")
                .containsEntry("vnp_ExpireDate", "20261124101500")
                .containsEntry("vnp_ReturnUrl", PROPS.returnUrl());
        assertThat(gateway.verify(params)).isTrue();
    }

    @Test
    void verify_rejectsTamperedAmountMissingHashAndForeignSecret_AC_PR_17() {
        Map<String, String> params = signed(Map.of("vnp_Amount", "9900000", "vnp_TxnRef", "abc",
                "vnp_ResponseCode", "00"));
        assertThat(gateway.verify(params)).isTrue();

        Map<String, String> tampered = new LinkedHashMap<>(params);
        tampered.put("vnp_Amount", "100");
        assertThat(gateway.verify(tampered)).isFalse();

        Map<String, String> noHash = new LinkedHashMap<>(params);
        noHash.remove("vnp_SecureHash");
        assertThat(gateway.verify(noHash)).isFalse();

        VnpayGateway other = new VnpayGateway(new VnpayProperties(PROPS.url(), "TESTTMN", "OTHER", PROPS.returnUrl()));
        assertThat(other.verify(params)).isFalse();
    }

    @Test
    void verify_ignoresHashTypeAndNonVnpParamsAndHashCase() {
        Map<String, String> params = signed(Map.of("vnp_Amount", "100", "vnp_OrderInfo", "Thanh toan goi Pro"));
        params.put("vnp_SecureHashType", "HmacSHA512");
        params.put("utm_source", "x");
        params.put("vnp_SecureHash", params.get("vnp_SecureHash").toUpperCase());
        assertThat(gateway.verify(params)).isTrue();
    }

    @Test
    void verify_failsWhenGatewayNotConfigured() {
        Map<String, String> params = signed(Map.of("vnp_Amount", "100"));
        VnpayGateway blank = new VnpayGateway(new VnpayProperties(PROPS.url(), "", "", ""));
        assertThat(blank.verify(params)).isFalse();
    }

    @Test
    void txnRef_roundTripsOrderIdAndRejectsOtherShapes() {
        UUID id = UUID.randomUUID();
        assertThat(VnpayGateway.orderIdOf(VnpayGateway.txnRefOf(id))).isEqualTo(id);
        assertThat(VnpayGateway.orderIdOf("123")).isNull();
        assertThat(VnpayGateway.orderIdOf(null)).isNull();
        assertThat(VnpayGateway.orderIdOf("zz" + "0".repeat(30))).isNull();
    }

    private Map<String, String> signed(Map<String, String> values) {
        Map<String, String> params = new LinkedHashMap<>(values);
        params.put("vnp_SecureHash", gateway.sign(VnpayGateway.canonical(new TreeMap<>(values))));
        return params;
    }

    private static Map<String, String> query(String url) {
        Map<String, String> params = new LinkedHashMap<>();
        for (String pair : URI.create(url).getRawQuery().split("&")) {
            String[] kv = pair.split("=", 2);
            params.put(kv[0], URLDecoder.decode(kv[1], StandardCharsets.US_ASCII));
        }
        return params;
    }
}
