package com.lingualoop.backend.common.exception;

import java.util.List;

/**
 * Lỗi validate của một field mà Bean Validation không diễn đạt được vì phụ thuộc trạng thái dữ liệu
 * (vd bắt buộc có mật khẩu hiện tại chỉ khi tài khoản đã có mật khẩu). Trả {@code VALIDATION_FAILED}
 * kèm {@code errors[]} giống lỗi Bean Validation để frontend gắn lỗi vào đúng ô.
 */
public class FieldValidationException extends BusinessException {

    private static final long serialVersionUID = 1L;

    private final String field;
    private final String constraint;

    /** @param constraint tên constraint tương đương, vd {@code NotBlank}, để frontend dịch theo code */
    public FieldValidationException(String field, String constraint) {
        super(ErrorCode.VALIDATION_FAILED);
        this.field = field;
        this.constraint = constraint;
    }

    public List<ErrorResponse.FieldError> fieldErrors() {
        return List.of(new ErrorResponse.FieldError(field, constraint, null, getMessage()));
    }
}
