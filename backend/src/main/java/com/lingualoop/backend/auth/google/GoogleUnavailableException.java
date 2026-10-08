package com.lingualoop.backend.auth.google;

import com.lingualoop.backend.common.exception.BusinessException;
import com.lingualoop.backend.common.exception.ErrorCode;

/** Không xác minh được ID token vì Google không phản hồi (hoặc chưa cấu hình client ID). */
public class GoogleUnavailableException extends BusinessException {

    private static final long serialVersionUID = 1L;

    public GoogleUnavailableException(String message, Throwable cause) {
        super(ErrorCode.AUTH_GOOGLE_UNAVAILABLE, message);
        initCause(cause);
    }

    public GoogleUnavailableException(String message) {
        super(ErrorCode.AUTH_GOOGLE_UNAVAILABLE, message);
    }
}
