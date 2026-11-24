package com.lingualoop.backend.subscription;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.within;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.net.URI;
import java.net.URLDecoder;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.sql.Timestamp;
import java.time.Instant;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.HexFormat;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.UUID;
import java.util.concurrent.Callable;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.stream.Collectors;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import com.jayway.jsonpath.JsonPath;
import com.lingualoop.backend.TestcontainersConfiguration;
import com.lingualoop.backend.security.Role;
import com.lingualoop.backend.user.AdminUserTestData;

/**
 * Nâng cấp, gia hạn và thanh toán gói Pro qua VNPAY (UC-PR-01 đến 04). Kết quả VNPAY được giả lập bằng cách tự ký tham
 * số với khóa bí mật của test, giống cách máy chủ VNPAY ký.
 */
@SpringBootTest(properties = {
    "app.vnpay.tmn-code=TESTTMN",
    "app.vnpay.hash-secret=TESTSECRET",
    "app.vnpay.return-url=http://localhost:5173/payment/vnpay-return",
})
@AutoConfigureMockMvc
@Import({TestcontainersConfiguration.class, AdminUserTestData.class})
class ProPaymentApiIntegrationTest {

    private static final String SECRET = "TESTSECRET";
    private static final String BASE = "/api/v1/subscriptions";
    private static final String IPN = "/api/v1/payments/vnpay/ipn";
    private static final ZoneId VN = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final long DAY = 24 * 3600;

    @Autowired private MockMvc mockMvc;
    @Autowired private AdminUserTestData data;
    @Autowired private JdbcTemplate jdbc;

    private UUID student;
    private UUID monthPlan;

    @BeforeEach
    void setUp() {
        student = data.user(Role.STUDENT, "Học viên");
        monthPlan = plan("1 tháng", 1, 99_000, 500, true);
    }

    // ------------------------------------------------------------------ helpers

    private UUID plan(String name, int months, int price, int credits, boolean onSale) {
        UUID id = UUID.randomUUID();
        jdbc.update("""
                INSERT INTO pro_plans (id, name, months, price_vnd, credits_per_month, on_sale)
                VALUES (?, ?, ?, ?, ?, ?)""", id, "pr " + id.toString().substring(0, 8) + " " + name, months, price,
                credits, onSale);
        return id;
    }

    private ResultActions as(UUID user, Role role, MockHttpServletRequestBuilder request) throws Exception {
        return mockMvc.perform(request.header(HttpHeaders.AUTHORIZATION, data.bearer(user, role)));
    }

    private ResultActions checkout(UUID user, UUID planId, String kind) throws Exception {
        return as(user, Role.STUDENT, post(BASE + "/orders").contentType(MediaType.APPLICATION_JSON)
                .content("{\"planId\":\"" + planId + "\",\"kind\":\"" + kind + "\"}"));
    }

    /** Tạo đơn chờ và trả {@code [orderId, paymentUrl]}. */
    private String[] pending(UUID user, UUID planId, String kind) throws Exception {
        String json = checkout(user, planId, kind).andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return new String[] {JsonPath.read(json, "$.data.order.id"), JsonPath.read(json, "$.data.paymentUrl")};
    }

    /** Một kết quả VNPAY đã ký cho đơn {@code orderId}. */
    private static Map<String, String> result(String orderId, long amountVnd, String code) {
        Map<String, String> params = new TreeMap<>();
        params.put("vnp_TmnCode", "TESTTMN");
        params.put("vnp_TxnRef", orderId.replace("-", ""));
        params.put("vnp_Amount", String.valueOf(amountVnd * 100));
        params.put("vnp_ResponseCode", code);
        params.put("vnp_TransactionStatus", code);
        params.put("vnp_TransactionNo", String.valueOf(System.nanoTime()));
        params.put("vnp_BankCode", "NCB");
        params.put("vnp_PayDate", "20261124103000");
        params.put("vnp_OrderInfo", "Thanh toan goi Pro LinguaLoop");
        return sign(params);
    }

    private static Map<String, String> sign(Map<String, String> params) {
        Map<String, String> sorted = new TreeMap<>(params);
        sorted.remove("vnp_SecureHash");
        String data = sorted.entrySet().stream()
                .map(e -> e.getKey() + "=" + URLEncoder.encode(e.getValue(), StandardCharsets.US_ASCII))
                .collect(Collectors.joining("&"));
        try {
            Mac mac = Mac.getInstance("HmacSHA512");
            mac.init(new SecretKeySpec(SECRET.getBytes(StandardCharsets.UTF_8), "HmacSHA512"));
            sorted.put("vnp_SecureHash", HexFormat.of().formatHex(mac.doFinal(data.getBytes(StandardCharsets.UTF_8))));
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
        return sorted;
    }

    private static MockHttpServletRequestBuilder withParams(MockHttpServletRequestBuilder request,
            Map<String, String> params) {
        params.forEach(request::param);
        return request;
    }

    private ResultActions ipn(Map<String, String> params) throws Exception {
        return mockMvc.perform(withParams(get(IPN), params));
    }

    private ResultActions vnpayReturn(UUID user, Map<String, String> params) throws Exception {
        return as(user, Role.STUDENT, withParams(get(BASE + "/orders/vnpay-return"), params));
    }

    private Map<String, Object> order(String orderId) {
        return jdbc.queryForMap("SELECT * FROM pro_orders WHERE id = ?", UUID.fromString(orderId));
    }

    private Instant endsAt(String orderId) {
        return ((Timestamp) order(orderId).get("ends_at")).toInstant();
    }

    /** Đơn đã thanh toán của học viên, đang hiệu lực từ {@code daysAgo} ngày trước tới {@code daysLeft} ngày nữa. */
    private UUID activePro(UUID user, int daysAgo, int daysLeft) {
        Instant now = Instant.now();
        UUID id = UUID.randomUUID();
        jdbc.update("""
                INSERT INTO pro_orders (id, user_id, plan_name, months, credits_per_month, amount_vnd, kind, status,
                                        expires_at, paid_at, starts_at, ends_at)
                VALUES (?, ?, 'Có sẵn', 1, 500, 99000, 'upgrade', 'paid', ?, ?, ?, ?)""", id, user,
                Timestamp.from(now), Timestamp.from(now), Timestamp.from(now.minusSeconds(daysAgo * DAY)),
                Timestamp.from(now.plusSeconds(daysLeft * DAY)));
        return id;
    }

    private String myPlan(UUID user) throws Exception {
        return as(user, Role.STUDENT, get(BASE + "/me")).andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
    }

    private static Instant plusMonths(Instant from, int months) {
        return from.atZone(VN).plusMonths(months).toInstant();
    }

    // ------------------------------------------------------------------ UC-PR-01

    @Test
    void myPlan_freeStudentHasNoPeriod_AC_PR_01() throws Exception {
        String json = myPlan(student);
        assertThat((String) JsonPath.read(json, "$.data.plan")).isEqualTo("free");
        assertThat((Object) JsonPath.read(json, "$.data.endsAt")).isNull();
    }

    @Test
    void myPlan_proShowsWholeChainedPeriod_AC_PR_02() throws Exception {
        activePro(student, 10, 20);
        Instant now = Instant.now();
        UUID next = UUID.randomUUID();
        jdbc.update("""
                INSERT INTO pro_orders (id, user_id, plan_name, months, credits_per_month, amount_vnd, kind, status,
                                        expires_at, paid_at, starts_at, ends_at)
                VALUES (?, ?, 'Gia hạn', 1, 500, 99000, 'renew', 'paid', ?, ?, ?, ?)""", next, student,
                Timestamp.from(now), Timestamp.from(now), Timestamp.from(now.plusSeconds(20 * DAY)),
                Timestamp.from(now.plusSeconds(50 * DAY)));

        String json = myPlan(student);
        assertThat((String) JsonPath.read(json, "$.data.plan")).isEqualTo("pro");
        assertThat(Instant.parse(JsonPath.read(json, "$.data.endsAt")))
                .isCloseTo(now.plusSeconds(50 * DAY), within(5, ChronoUnit.SECONDS));
        assertThat(Instant.parse(JsonPath.read(json, "$.data.startsAt")))
                .isCloseTo(now.minusSeconds(10 * DAY), within(5, ChronoUnit.SECONDS));
    }

    @Test
    void myPlan_expiredProIsFree_AC_PR_03() throws Exception {
        activePro(student, 31, -1);
        assertThat((String) JsonPath.read(myPlan(student), "$.data.plan")).isEqualTo("free");
    }

    @Test
    void orders_onlyOwnHistoryAndOtherUsersOrderIsNotFound_AC_PR_04() throws Exception {
        String mine = pending(student, monthPlan, "upgrade")[0];
        UUID other = data.user(Role.STUDENT, "Học viên 2");
        String theirs = pending(other, monthPlan, "upgrade")[0];

        String json = as(student, Role.STUDENT, get(BASE + "/orders")).andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        List<String> ids = JsonPath.read(json, "$.data[*].id");
        assertThat(ids).containsExactly(mine);

        as(student, Role.STUDENT, get(BASE + "/orders/" + theirs))
                .andExpect(status().isNotFound()).andExpect(jsonPath("$.code").value("NOT_FOUND"));
    }

    // ------------------------------------------------------------------ UC-PR-02

    @Test
    void plans_listOnlyPlansOnSale_AC_PR_06() throws Exception {
        UUID hidden = plan("ẩn", 3, 250_000, 500, false);
        String json = as(student, Role.STUDENT, get(BASE + "/plans")).andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        List<String> ids = JsonPath.read(json, "$.data[*].id");
        assertThat(ids).contains(monthPlan.toString()).doesNotContain(hidden.toString());
    }

    @Test
    void checkout_createsPendingOrderAndSignedVnpayUrl_AC_PR_06() throws Exception {
        String json = checkout(student, monthPlan, "upgrade").andExpect(status().isOk())
                .andExpect(jsonPath("$.data.order.status").value("pending"))
                .andExpect(jsonPath("$.data.order.kind").value("upgrade"))
                .andExpect(jsonPath("$.data.order.amountVnd").value(99_000))
                .andExpect(jsonPath("$.data.order.months").value(1))
                .andReturn().getResponse().getContentAsString();
        String orderId = JsonPath.read(json, "$.data.order.id");
        Map<String, String> query = query(JsonPath.read(json, "$.data.paymentUrl"));

        assertThat(query).containsEntry("vnp_Amount", "9900000")
                .containsEntry("vnp_TxnRef", orderId.replace("-", ""))
                .containsEntry("vnp_TmnCode", "TESTTMN");
        assertThat(sign(query).get("vnp_SecureHash")).isEqualTo(query.get("vnp_SecureHash"));
        Instant created = Instant.parse(JsonPath.read(json, "$.data.order.createdAt"));
        Instant expires = Instant.parse(JsonPath.read(json, "$.data.order.expiresAt"));
        assertThat(expires).isEqualTo(created.plusSeconds(15 * 60));
    }

    @Test
    void checkout_proStudentCannotUpgradeAgain_AC_PR_09() throws Exception {
        activePro(student, 1, 20);
        checkout(student, monthPlan, "upgrade")
                .andExpect(status().isConflict()).andExpect(jsonPath("$.code").value("PRO_ALREADY_ACTIVE"));
    }

    @Test
    void checkout_planNotOnSaleOrUnknownIsRejected_AC_PR_10() throws Exception {
        UUID hidden = plan("ẩn", 3, 250_000, 500, false);
        checkout(student, hidden, "upgrade")
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.code").value("PRO_PLAN_NOT_ON_SALE"));
        checkout(student, UUID.randomUUID(), "upgrade")
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.code").value("PRO_PLAN_NOT_ON_SALE"));
        checkout(student, monthPlan, "lifetime").andExpect(status().isBadRequest());
    }

    @Test
    void checkout_teacherIsForbidden() throws Exception {
        UUID teacher = data.user(Role.TEACHER, "Giáo viên");
        as(teacher, Role.TEACHER, post(BASE + "/orders").contentType(MediaType.APPLICATION_JSON)
                .content("{\"planId\":\"" + monthPlan + "\",\"kind\":\"upgrade\"}"))
                .andExpect(status().isForbidden());
    }

    // ------------------------------------------------------------------ UC-PR-03

    @Test
    void ipnSuccess_activatesProWithPlanCredits_AC_PR_12() throws Exception {
        String orderId = pending(student, monthPlan, "upgrade")[0];
        Instant before = Instant.now();

        ipn(result(orderId, 99_000, "00")).andExpect(status().isOk())
                .andExpect(jsonPath("$.RspCode").value("00"));

        Map<String, Object> row = order(orderId);
        assertThat(row.get("status")).isEqualTo("paid");
        assertThat(row.get("vnpay_transaction_no")).isNotNull();
        assertThat(row.get("vnpay_bank_code")).isEqualTo("NCB");
        Instant starts = ((Timestamp) row.get("starts_at")).toInstant();
        assertThat(starts).isBetween(before.minusSeconds(1), Instant.now());
        assertThat(endsAt(orderId)).isEqualTo(plusMonths(starts, 1));
        assertThat((String) JsonPath.read(myPlan(student), "$.data.plan")).isEqualTo("pro");
        as(student, Role.STUDENT, get("/api/v1/credits/balance")).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.kind").value("pro"))
                .andExpect(jsonPath("$.data.balance").value(500));
    }

    @Test
    void repeatedIpnAndReturn_activateOnlyOnce_AC_PR_13() throws Exception {
        String orderId = pending(student, monthPlan, "upgrade")[0];
        Map<String, String> success = result(orderId, 99_000, "00");

        vnpayReturn(student, success).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("paid"));
        Instant ends = endsAt(orderId);
        ipn(success).andExpect(jsonPath("$.RspCode").value("02"));
        ipn(success).andExpect(jsonPath("$.RspCode").value("02"));
        vnpayReturn(student, success).andExpect(status().isOk());

        assertThat(endsAt(orderId)).isEqualTo(ends);
        Integer paid = jdbc.queryForObject("SELECT count(*) FROM pro_orders WHERE user_id = ? AND status = 'paid'",
                Integer.class, student);
        assertThat(paid).isEqualTo(1);
    }

    @Test
    void concurrentIpnAndReturn_activateOnlyOnce_AC_PR_13() throws Exception {
        String orderId = pending(student, monthPlan, "upgrade")[0];
        Map<String, String> success = result(orderId, 99_000, "00");
        ExecutorService pool = Executors.newFixedThreadPool(4);
        try {
            List<Callable<Integer>> calls = List.of(
                    () -> ipn(success).andReturn().getResponse().getStatus(),
                    () -> ipn(success).andReturn().getResponse().getStatus(),
                    () -> vnpayReturn(student, success).andReturn().getResponse().getStatus(),
                    () -> vnpayReturn(student, success).andReturn().getResponse().getStatus());
            for (Future<Integer> f : pool.invokeAll(calls)) {
                assertThat(f.get()).isEqualTo(200);
            }
        } finally {
            pool.shutdown();
        }
        Instant starts = ((Timestamp) order(orderId).get("starts_at")).toInstant();
        assertThat(endsAt(orderId)).isEqualTo(plusMonths(starts, 1));
        assertThat((String) JsonPath.read(myPlan(student), "$.data.plan")).isEqualTo("pro");
    }

    @Test
    void canceledOnVnpay_keepsCurrentPlan_AC_PR_14() throws Exception {
        String orderId = pending(student, monthPlan, "upgrade")[0];
        vnpayReturn(student, result(orderId, 99_000, "24")).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("canceled"))
                .andExpect(jsonPath("$.data.responseCode").value("24"));
        assertThat((String) JsonPath.read(myPlan(student), "$.data.plan")).isEqualTo("free");
    }

    @Test
    void pendingOrderExpiresAfterFifteenMinutes_AC_PR_15() throws Exception {
        String orderId = pending(student, monthPlan, "upgrade")[0];
        jdbc.update("UPDATE pro_orders SET created_at = created_at - interval '16 minutes', "
                + "expires_at = expires_at - interval '16 minutes' WHERE id = ?", UUID.fromString(orderId));

        as(student, Role.STUDENT, get(BASE + "/orders/" + orderId)).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("expired"));
        // Đơn hết hạn không chặn tạo đơn mới
        checkout(student, monthPlan, "upgrade").andExpect(status().isOk());
    }

    @Test
    void failedPaymentOrWrongAmount_doesNotActivate_AC_PR_16() throws Exception {
        String orderId = pending(student, monthPlan, "upgrade")[0];

        ipn(result(orderId, 1_000, "00")).andExpect(jsonPath("$.RspCode").value("04"));
        assertThat(order(orderId).get("status")).isEqualTo("pending");

        ipn(result(orderId, 99_000, "51")).andExpect(jsonPath("$.RspCode").value("00"));
        Map<String, Object> row = order(orderId);
        assertThat(row.get("status")).isEqualTo("failed");
        assertThat(row.get("vnpay_response_code")).isEqualTo("51");
        assertThat((String) JsonPath.read(myPlan(student), "$.data.plan")).isEqualTo("free");

        // Kết quả thành công đến sau cho đơn đã thất bại không đổi gì
        ipn(result(orderId, 99_000, "00")).andExpect(jsonPath("$.RspCode").value("02"));
        assertThat(order(orderId).get("status")).isEqualTo("failed");
    }

    @Test
    void forgedResultFromBrowserIsRejected_AC_PR_17() throws Exception {
        String orderId = pending(student, monthPlan, "upgrade")[0];
        Map<String, String> forged = new LinkedHashMap<>(result(orderId, 99_000, "00"));
        forged.put("vnp_SecureHash", "0".repeat(128));

        vnpayReturn(student, forged).andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("PAYMENT_INVALID_RESULT"));
        ipn(forged).andExpect(jsonPath("$.RspCode").value("97"));

        Map<String, String> unsigned = new LinkedHashMap<>(result(orderId, 99_000, "00"));
        unsigned.remove("vnp_SecureHash");
        vnpayReturn(student, unsigned).andExpect(status().isBadRequest());

        assertThat(order(orderId).get("status")).isEqualTo("pending");
        assertThat((String) JsonPath.read(myPlan(student), "$.data.plan")).isEqualTo("free");
    }

    @Test
    void ipnAloneActivatesWhenBrowserNeverReturns_AC_PR_18() throws Exception {
        String orderId = pending(student, monthPlan, "upgrade")[0];
        ipn(result(orderId, 99_000, "00")).andExpect(jsonPath("$.RspCode").value("00"));

        as(student, Role.STUDENT, get(BASE + "/orders/" + orderId)).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("paid"))
                .andExpect(jsonPath("$.data.bankCode").value("NCB"));
        assertThat((String) JsonPath.read(myPlan(student), "$.data.plan")).isEqualTo("pro");
    }

    @Test
    void ipnForUnknownOrderIsNotFound() throws Exception {
        ipn(result(UUID.randomUUID().toString(), 99_000, "00")).andExpect(jsonPath("$.RspCode").value("01"));
    }

    @Test
    void returnForAnotherStudentsOrderIsNotFound_AC_PR_04() throws Exception {
        String orderId = pending(student, monthPlan, "upgrade")[0];
        UUID other = data.user(Role.STUDENT, "Học viên 2");
        vnpayReturn(other, result(orderId, 99_000, "24")).andExpect(status().isNotFound());
    }

    @Test
    void retryingCancelsPreviousPendingOrderAndIssuesNewTxnRef_AC_PR_23() throws Exception {
        String[] first = pending(student, monthPlan, "upgrade");
        String[] second = pending(student, monthPlan, "upgrade");

        assertThat(second[0]).isNotEqualTo(first[0]);
        assertThat(query(second[1]).get("vnp_TxnRef")).isEqualTo(second[0].replace("-", ""));
        assertThat(order(first[0]).get("status")).isEqualTo("canceled");
        assertThat(order(second[0]).get("status")).isEqualTo("pending");
    }

    @Test
    void lateSuccessForCanceledOrderIsHonoredAndChained_AC_PR_24() throws Exception {
        String a = pending(student, monthPlan, "upgrade")[0];
        String b = pending(student, monthPlan, "upgrade")[0];
        ipn(result(b, 99_000, "00")).andExpect(jsonPath("$.RspCode").value("00"));
        Instant bEnds = endsAt(b);

        ipn(result(a, 99_000, "00")).andExpect(jsonPath("$.RspCode").value("00"));

        Map<String, Object> row = order(a);
        assertThat(row.get("status")).isEqualTo("paid");
        assertThat(row.get("canceled_at")).isNotNull();
        assertThat(((Timestamp) row.get("starts_at")).toInstant()).isEqualTo(bEnds);
        assertThat(endsAt(a)).isEqualTo(plusMonths(bEnds, 1));
    }

    @Test
    void lateSuccessForExpiredOrderIsHonored_AC_PR_24() throws Exception {
        String orderId = pending(student, monthPlan, "upgrade")[0];
        jdbc.update("UPDATE pro_orders SET status = 'expired' WHERE id = ?", UUID.fromString(orderId));
        ipn(result(orderId, 99_000, "00")).andExpect(jsonPath("$.RspCode").value("00"));
        assertThat(order(orderId).get("status")).isEqualTo("paid");
        assertThat((String) JsonPath.read(myPlan(student), "$.data.plan")).isEqualTo("pro");
    }

    // ------------------------------------------------------------------ UC-PR-04

    @Test
    void renewChainsOntoCurrentEnd_AC_PR_19() throws Exception {
        UUID current = activePro(student, 20, 10);
        Instant currentEnd = ((Timestamp) jdbc.queryForObject("SELECT ends_at FROM pro_orders WHERE id = ?",
                Timestamp.class, current)).toInstant();

        String orderId = pending(student, monthPlan, "renew")[0];
        ipn(result(orderId, 99_000, "00")).andExpect(jsonPath("$.RspCode").value("00"));

        assertThat(((Timestamp) order(orderId).get("starts_at")).toInstant()).isEqualTo(currentEnd);
        assertThat(endsAt(orderId)).isEqualTo(plusMonths(currentEnd, 1));
        assertThat(order(orderId).get("kind")).isEqualTo("renew");
        assertThat(Instant.parse(JsonPath.read(myPlan(student), "$.data.endsAt"))).isEqualTo(endsAt(orderId));
    }

    @Test
    void freeStudentCannotRenew_AC_PR_21() throws Exception {
        checkout(student, monthPlan, "renew")
                .andExpect(status().isConflict()).andExpect(jsonPath("$.code").value("PRO_NOT_ACTIVE"));
        activePro(student, 31, -1);
        checkout(student, monthPlan, "renew")
                .andExpect(status().isConflict()).andExpect(jsonPath("$.code").value("PRO_NOT_ACTIVE"));
    }

    @Test
    void renewingTwiceAddsBothPeriods_AC_PR_22() throws Exception {
        UUID current = activePro(student, 20, 10);
        Instant currentEnd = ((Timestamp) jdbc.queryForObject("SELECT ends_at FROM pro_orders WHERE id = ?",
                Timestamp.class, current)).toInstant();

        String first = pending(student, monthPlan, "renew")[0];
        ipn(result(first, 99_000, "00")).andExpect(jsonPath("$.RspCode").value("00"));
        String second = pending(student, monthPlan, "renew")[0];
        ipn(result(second, 99_000, "00")).andExpect(jsonPath("$.RspCode").value("00"));

        assertThat(endsAt(second)).isEqualTo(plusMonths(plusMonths(currentEnd, 1), 1));
    }

    // ------------------------------------------------------------------ gói 0 đồng

    @Test
    void freePlanIsActivatedWithoutVnpay() throws Exception {
        UUID zero = plan("0 đồng", 1, 0, 100, true);
        checkout(student, zero, "upgrade").andExpect(status().isOk())
                .andExpect(jsonPath("$.data.order.status").value("paid"))
                .andExpect(jsonPath("$.data.paymentUrl").doesNotExist());
        assertThat((String) JsonPath.read(myPlan(student), "$.data.plan")).isEqualTo("pro");
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
