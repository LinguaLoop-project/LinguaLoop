package com.lingualoop.backend.common.exception;

import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.context.MessageSourceResolvable;

import jakarta.validation.ConstraintViolation;

/** Chuyển lỗi Bean Validation thành {@link ErrorResponse.FieldError} có code và params để frontend dịch. */
final class ValidationErrors {

    /** Thuộc tính chung của mọi constraint, không có ích cho câu hiển thị. */
    private static final Set<String> IGNORED_ATTRIBUTES = Set.of("message", "groups", "payload");

    private ValidationErrors() {
    }

    static ErrorResponse.FieldError from(String field, ConstraintViolation<?> violation) {
        var descriptor = violation.getConstraintDescriptor();
        return new ErrorResponse.FieldError(field,
                descriptor.getAnnotation().annotationType().getSimpleName(),
                params(descriptor.getAttributes()),
                violation.getMessage());
    }

    /** Dùng khi lỗi không đến từ Bean Validation (vd lỗi chuyển kiểu khi bind). */
    static ErrorResponse.FieldError from(String field, MessageSourceResolvable error) {
        return new ErrorResponse.FieldError(field, lastCode(error.getCodes()), Map.of(), error.getDefaultMessage());
    }

    /** Code cuối là dạng chung nhất, vd {@code NotBlank} thay vì {@code NotBlank.body.name}. */
    private static String lastCode(String[] codes) {
        return codes == null || codes.length == 0 ? null : codes[codes.length - 1];
    }

    private static Map<String, Object> params(Map<String, Object> attributes) {
        return attributes.entrySet().stream()
                .filter(e -> !IGNORED_ATTRIBUTES.contains(e.getKey()))
                .filter(e -> e.getValue() instanceof Number || e.getValue() instanceof String
                        || e.getValue() instanceof Boolean)
                .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue));
    }
}
