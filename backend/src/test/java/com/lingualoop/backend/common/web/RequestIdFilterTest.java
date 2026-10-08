package com.lingualoop.backend.common.web;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.UUID;
import java.util.concurrent.atomic.AtomicReference;

import org.junit.jupiter.api.Test;
import org.slf4j.MDC;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import jakarta.servlet.FilterChain;

class RequestIdFilterTest {

    private final RequestIdFilter filter = new RequestIdFilter();

    @Test
    void keepsSafeIncomingRequestId() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/v1/lessons");
        request.addHeader(RequestIdFilter.HEADER, "3f2c1d4e-5b6a-4c7d-8e9f-0a1b2c3d4e5f");
        MockHttpServletResponse response = new MockHttpServletResponse();
        AtomicReference<String> seenInMdc = new AtomicReference<>();

        filter.doFilter(request, response, captureMdc(seenInMdc));

        assertThat(response.getHeader(RequestIdFilter.HEADER)).isEqualTo("3f2c1d4e-5b6a-4c7d-8e9f-0a1b2c3d4e5f");
        assertThat(seenInMdc.get()).isEqualTo("3f2c1d4e-5b6a-4c7d-8e9f-0a1b2c3d4e5f");
        assertThat(MDC.get(RequestIdFilter.MDC_KEY)).isNull();
    }

    @Test
    void generatesIdWhenHeaderMissing() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/actuator/health");
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilter(request, response, captureMdc(new AtomicReference<>()));

        assertThat(UUID.fromString(response.getHeader(RequestIdFilter.HEADER))).isNotNull();
    }

    @Test
    void replacesUnsafeIncomingId() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/v1/lessons");
        request.addHeader(RequestIdFilter.HEADER, "bad\nlog line");
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilter(request, response, captureMdc(new AtomicReference<>()));

        assertThat(response.getHeader(RequestIdFilter.HEADER)).isNotEqualTo("bad\nlog line");
    }

    @Test
    void clearsMdcEvenWhenChainThrows() {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/v1/lessons");
        FilterChain failing = (req, res) -> {
            throw new IllegalStateException("boom");
        };

        try {
            filter.doFilter(request, new MockHttpServletResponse(), failing);
        } catch (Exception expected) {
            // chỉ cần kiểm tra MDC đã được dọn
        }

        assertThat(MDC.get(RequestIdFilter.MDC_KEY)).isNull();
    }

    private static FilterChain captureMdc(AtomicReference<String> target) {
        return (req, res) -> target.set(MDC.get(RequestIdFilter.MDC_KEY));
    }
}
