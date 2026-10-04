package com.lingualoop.backend.common.exception;

import lombok.Getter;

/** Lỗi nghiệp vụ; GlobalExceptionHandler đổi thành ErrorResponse theo {@link ErrorCode}. */
@Getter
public class BusinessException extends RuntimeException {

    private static final long serialVersionUID = 1L;

    private final ErrorCode errorCode;

    public BusinessException(ErrorCode errorCode) {
        this(errorCode, errorCode.getDefaultMessage());
    }

    public BusinessException(ErrorCode errorCode, String message) {
        super(message);
        this.errorCode = errorCode;
    }
}
