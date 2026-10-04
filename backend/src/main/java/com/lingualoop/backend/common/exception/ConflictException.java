package com.lingualoop.backend.common.exception;

public class ConflictException extends BusinessException {

    private static final long serialVersionUID = 1L;

    public ConflictException() {
        super(ErrorCode.CONFLICT);
    }

    public ConflictException(String message) {
        super(ErrorCode.CONFLICT, message);
    }
}
