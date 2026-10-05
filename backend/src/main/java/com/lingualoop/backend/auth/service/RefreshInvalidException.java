package com.lingualoop.backend.auth.service;

import com.lingualoop.backend.common.exception.BusinessException;
import com.lingualoop.backend.common.exception.ErrorCode;

/** Refresh token thiếu, sai, hết hạn hoặc đã bị thu hồi; controller xoá cookie khi gặp lỗi này. */
public class RefreshInvalidException extends BusinessException {

    private static final long serialVersionUID = 1L;

    public RefreshInvalidException() {
        super(ErrorCode.AUTH_REFRESH_INVALID);
    }
}
