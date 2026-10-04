package com.lingualoop.backend.common.web;

import java.io.IOException;
import java.util.UUID;

import org.slf4j.MDC;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;

/**
 * Gắn mã request vào MDC và header {@code X-Request-Id}, rồi log một dòng cho mỗi request.
 * Chạy trước Spring Security để cả lỗi 401/403 cũng mang mã này.
 */
@Slf4j
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class RequestIdFilter extends OncePerRequestFilter {

    public static final String HEADER = "X-Request-Id";
    public static final String MDC_KEY = "requestId";

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String requestId = parseOrGenerate(request.getHeader(HEADER));
        long start = System.nanoTime();
        MDC.put(MDC_KEY, requestId);
        response.setHeader(HEADER, requestId);
        try {
            chain.doFilter(request, response);
        } finally {
            if (!request.getRequestURI().startsWith("/actuator")) {
                log.info("{} {} -> {} ({} ms)", request.getMethod(), request.getRequestURI(),
                        response.getStatus(), (System.nanoTime() - start) / 1_000_000);
            }
            MDC.remove(MDC_KEY);
        }
    }

    /**
     * Chỉ nhận mã client gửi lên nếu là UUID (frontend dùng {@code crypto.randomUUID()}),
     * và ghi lại bản chuẩn hoá để không chèn ký tự lạ vào log hay header.
     */
    private static String parseOrGenerate(String incoming) {
        if (incoming != null && incoming.length() == 36) {
            try {
                return UUID.fromString(incoming).toString();
            } catch (IllegalArgumentException e) {
                // bỏ qua, sinh mã mới
            }
        }
        return UUID.randomUUID().toString();
    }
}
