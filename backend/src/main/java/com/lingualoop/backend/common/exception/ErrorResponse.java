package com.lingualoop.backend.common.exception;

import java.time.Instant;
import java.util.List;
import java.util.Map;

import org.slf4j.MDC;

import com.lingualoop.backend.common.web.RequestIdFilter;

/**
 * Định dạng lỗi duy nhất của API. {@code traceId} trùng header {@code X-Request-Id}
 * để tra log; {@code errors} chỉ có khi lỗi validate.
 */
public record ErrorResponse(
        int status,
        String code,
        String message,
        String path,
        String traceId,
        Instant timestamp,
        List<FieldError> errors) {

    public ErrorResponse {
        errors = errors == null ? List.of() : List.copyOf(errors);
    }

    /**
     * Lỗi của một field. Frontend dịch theo {@code code} (tên constraint, vd {@code NotBlank},
     * {@code Size}) và chèn {@code params} (vd {@code min}, {@code max}); {@code message}
     * chỉ là câu dự phòng cho dev.
     */
    public record FieldError(String field, String code, Map<String, Object> params, String message) {

        public FieldError {
            params = params == null ? Map.of() : Map.copyOf(params);
        }
    }

    public static ErrorResponse of(ErrorCode code, String message, String path) {
        return of(code, message, path, List.of());
    }

    public static ErrorResponse of(ErrorCode code, String message, String path, List<FieldError> errors) {
        return new ErrorResponse(code.getStatus().value(), code.name(), message, path,
                MDC.get(RequestIdFilter.MDC_KEY), Instant.now(), errors);
    }
}
