package com.lingualoop.backend.common.exception;

import java.util.Map;

import lombok.Getter;

/** Lỗi nghiệp vụ; GlobalExceptionHandler đổi thành ErrorResponse theo {@link ErrorCode}. */
@Getter
public class BusinessException extends RuntimeException {

    private static final long serialVersionUID = 1L;

    private final ErrorCode errorCode;

    /** Dữ liệu kèm theo để frontend chèn vào câu dịch (vd {@code remainingAttempts}, {@code lockedUntil}). */
    private final Map<String, Object> details;

    public BusinessException(ErrorCode errorCode) {
        this(errorCode, errorCode.getDefaultMessage());
    }

    public BusinessException(ErrorCode errorCode, String message) {
        this(errorCode, message, Map.of());
    }

    public BusinessException(ErrorCode errorCode, Map<String, Object> details) {
        this(errorCode, errorCode.getDefaultMessage(), details);
    }

    public BusinessException(ErrorCode errorCode, String message, Map<String, Object> details) {
        super(message);
        this.errorCode = errorCode;
        this.details = details == null ? Map.of() : Map.copyOf(details);
    }
}
