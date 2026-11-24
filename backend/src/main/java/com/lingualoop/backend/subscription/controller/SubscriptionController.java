package com.lingualoop.backend.subscription.controller;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.lingualoop.backend.common.response.ApiResponse;
import com.lingualoop.backend.security.CurrentUserId;
import com.lingualoop.backend.subscription.dto.CheckoutView;
import com.lingualoop.backend.subscription.dto.OrderView;
import com.lingualoop.backend.subscription.dto.PlanResponse;
import com.lingualoop.backend.subscription.dto.SalePlanView;
import com.lingualoop.backend.subscription.dto.request.CreateOrderRequest;
import com.lingualoop.backend.subscription.service.ProPaymentService;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/** Gói đăng ký của người dùng đang đăng nhập (UC-PR-01 đến 04). */
@RestController
@RequestMapping("/api/v1/subscriptions")
@RequiredArgsConstructor
public class SubscriptionController {

    private final ProPaymentService payments;

    @GetMapping("/me")
    public ApiResponse<PlanResponse> getMyPlan(@CurrentUserId UUID userId) {
        return ApiResponse.ok(payments.myPlan(userId));
    }

    @GetMapping("/plans")
    public ApiResponse<List<SalePlanView>> plans() {
        return ApiResponse.ok(payments.plansOnSale());
    }

    @PostMapping("/orders")
    public ApiResponse<CheckoutView> checkout(@CurrentUserId UUID userId,
            @Valid @RequestBody CreateOrderRequest request, HttpServletRequest http) {
        return ApiResponse.ok(payments.checkout(userId, request, ClientIp.of(http)));
    }

    @GetMapping("/orders")
    public ApiResponse<List<OrderView>> orders(@CurrentUserId UUID userId) {
        return ApiResponse.ok(payments.orders(userId));
    }

    /** Trang kết quả của frontend gửi nguyên các tham số VNPAY mang về qua Return URL (BR-PR-08). */
    @GetMapping("/orders/vnpay-return")
    public ApiResponse<OrderView> vnpayReturn(@CurrentUserId UUID userId, @RequestParam Map<String, String> params) {
        return ApiResponse.ok(payments.confirmReturn(userId, params));
    }

    @GetMapping("/orders/{orderId}")
    public ApiResponse<OrderView> order(@CurrentUserId UUID userId, @PathVariable UUID orderId) {
        return ApiResponse.ok(payments.order(userId, orderId));
    }
}
