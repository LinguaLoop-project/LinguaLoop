package com.lingualoop.backend.common.exception;

import static org.hamcrest.Matchers.not;
import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.slf4j.MDC;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.MediaType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

import com.lingualoop.backend.common.web.RequestIdFilter;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

class GlobalExceptionHandlerTest {

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(new FakeController())
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
        MDC.remove(RequestIdFilter.MDC_KEY);
    }

    @Test
    void businessException_usesItsErrorCodeAndMessage() throws Exception {
        MDC.put(RequestIdFilter.MDC_KEY, "trace-1");
        try {
            mockMvc.perform(get("/fake/not-found"))
                    .andExpect(status().isNotFound())
                    .andExpect(jsonPath("$.status").value(404))
                    .andExpect(jsonPath("$.code").value("NOT_FOUND"))
                    .andExpect(jsonPath("$.message").value("Lesson 42 not found"))
                    .andExpect(jsonPath("$.path").value("/fake/not-found"))
                    .andExpect(jsonPath("$.traceId").value("trace-1"))
                    .andExpect(jsonPath("$.timestamp").exists());
        } finally {
            MDC.remove(RequestIdFilter.MDC_KEY);
        }
    }

    @Test
    void customErrorCode_mapsToItsHttpStatus() throws Exception {
        mockMvc.perform(get("/fake/quota"))
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.code").value("QUOTA_EXCEEDED"));
    }

    @Test
    void invalidBody_returnsFieldErrors() throws Exception {
        mockMvc.perform(post("/fake/body").contentType(MediaType.APPLICATION_JSON).content("{\"name\":\"\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"))
                .andExpect(jsonPath("$.errors[0].field").value("name"))
                .andExpect(jsonPath("$.errors[0].code").value("NotBlank"));
    }

    @Test
    void sizeViolation_exposesConstraintParamsForTranslation() throws Exception {
        mockMvc.perform(post("/fake/body").contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"abcdefghijk\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[0].code").value("Size"))
                .andExpect(jsonPath("$.errors[0].params.max").value(10))
                .andExpect(jsonPath("$.errors[0].params.message").doesNotExist());
    }

    @Test
    void invalidRequestParam_returnsFieldErrorWithCode() throws Exception {
        mockMvc.perform(get("/fake/limit").param("limit", "0"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"))
                .andExpect(jsonPath("$.errors[0].field").value("limit"))
                .andExpect(jsonPath("$.errors[0].code").value("Min"))
                .andExpect(jsonPath("$.errors[0].params.value").value(1));
    }

    @Test
    void malformedJson_returnsBadRequest() throws Exception {
        mockMvc.perform(post("/fake/body").contentType(MediaType.APPLICATION_JSON).content("{oops"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("BAD_REQUEST"));
    }

    @Test
    void missingParam_returnsBadRequest() throws Exception {
        mockMvc.perform(get("/fake/param"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("BAD_REQUEST"));
    }

    @Test
    void wrongParamType_returnsBadRequest() throws Exception {
        mockMvc.perform(get("/fake/param").param("page", "abc"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("BAD_REQUEST"));
    }

    @Test
    void wrongContentType_returns415() throws Exception {
        mockMvc.perform(post("/fake/body").contentType(MediaType.TEXT_PLAIN).content("hi"))
                .andExpect(status().isUnsupportedMediaType())
                .andExpect(jsonPath("$.code").value("UNSUPPORTED_MEDIA_TYPE"));
    }

    @Test
    void uploadTooLarge_returns413() throws Exception {
        mockMvc.perform(get("/fake/too-large"))
                .andExpect(status().is(413))
                .andExpect(jsonPath("$.code").value("PAYLOAD_TOO_LARGE"));
    }

    @Test
    void wrongMethod_returns405() throws Exception {
        mockMvc.perform(post("/fake/not-found"))
                .andExpect(status().isMethodNotAllowed())
                .andExpect(jsonPath("$.code").value("METHOD_NOT_ALLOWED"));
    }

    @Test
    void accessDenied_returns403() throws Exception {
        mockMvc.perform(get("/fake/denied"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("FORBIDDEN"));
    }

    @Test
    void dataIntegrityViolation_returns409() throws Exception {
        mockMvc.perform(get("/fake/duplicate"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("CONFLICT"));
    }

    @Test
    void unexpectedException_returns500WithoutLeakingMessage() throws Exception {
        mockMvc.perform(get("/fake/boom"))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.code").value("INTERNAL_ERROR"))
                .andExpect(content().string(not(containsString("secret-detail"))));
    }

    record FakeBody(@NotBlank @Size(max = 10) String name) {
    }

    @RestController
    static class FakeController {

        @GetMapping("/fake/not-found")
        String notFound() {
            throw new NotFoundException("Lesson 42 not found");
        }

        @GetMapping("/fake/quota")
        String quota() {
            throw new BusinessException(ErrorCode.QUOTA_EXCEEDED);
        }

        @PostMapping("/fake/body")
        String body(@Valid @RequestBody FakeBody body) {
            return body.name();
        }

        @GetMapping("/fake/param")
        String param(@RequestParam int page) {
            return String.valueOf(page);
        }

        @GetMapping("/fake/limit")
        String limit(@RequestParam @Min(1) int limit) {
            return String.valueOf(limit);
        }

        @GetMapping("/fake/too-large")
        String tooLarge() {
            throw new MaxUploadSizeExceededException(10L * 1024 * 1024);
        }

        @GetMapping("/fake/denied")
        String denied() {
            throw new AccessDeniedException("nope");
        }

        @GetMapping("/fake/duplicate")
        String duplicate() {
            throw new DataIntegrityViolationException("duplicate key");
        }

        @GetMapping("/fake/boom")
        String boom() {
            throw new IllegalStateException("secret-detail");
        }
    }
}
