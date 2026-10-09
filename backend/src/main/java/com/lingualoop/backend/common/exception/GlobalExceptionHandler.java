package com.lingualoop.backend.common.exception;

import java.util.List;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.HttpMediaTypeNotAcceptableException;
import org.springframework.web.HttpMediaTypeNotSupportedException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MissingRequestHeaderException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.HandlerMethodValidationException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.multipart.support.MissingServletRequestPartException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.ConstraintViolationException;
import lombok.extern.slf4j.Slf4j;

/**
 * Đổi mọi exception ra khỏi controller thành {@link ErrorResponse}.
 */
@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<ErrorResponse> handleBusiness(BusinessException ex, HttpServletRequest request) {
        ErrorCode code = ex.getErrorCode();
        List<ErrorResponse.FieldError> errors = ex instanceof FieldValidationException fieldError
                ? fieldError.fieldErrors()
                : List.of();
        return ResponseEntity.status(code.getStatus())
                .body(ErrorResponse.of(code, ex.getMessage(), request.getRequestURI(), errors, ex.getDetails()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleBodyValidation(MethodArgumentNotValidException ex,
            HttpServletRequest request) {
        List<ErrorResponse.FieldError> errors = ex.getBindingResult().getFieldErrors().stream()
                .map(e -> e.contains(ConstraintViolation.class)
                        ? ValidationErrors.from(e.getField(), e.unwrap(ConstraintViolation.class))
                        : ValidationErrors.from(e.getField(), e))
                .toList();
        return validationFailed(request, errors);
    }

    @ExceptionHandler(HandlerMethodValidationException.class)
    public ResponseEntity<ErrorResponse> handleParamValidation(HandlerMethodValidationException ex,
            HttpServletRequest request) {
        List<ErrorResponse.FieldError> errors = ex.getParameterValidationResults().stream()
                .flatMap(r -> {
                    String field = r.getMethodParameter().getParameterName();
                    return r.getResolvableErrors().stream()
                            .map(e -> ValidationErrors.from(field, r.unwrap(e, ConstraintViolation.class)));
                })
                .toList();
        return validationFailed(request, errors);
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ErrorResponse> handleConstraintViolation(ConstraintViolationException ex,
            HttpServletRequest request) {
        List<ErrorResponse.FieldError> errors = ex.getConstraintViolations().stream()
                .map(v -> ValidationErrors.from(v.getPropertyPath().toString(), v))
                .toList();
        return validationFailed(request, errors);
    }

    @ExceptionHandler({ HttpMessageNotReadableException.class, MissingServletRequestParameterException.class,
            MethodArgumentTypeMismatchException.class, MissingServletRequestPartException.class,
            MissingRequestHeaderException.class })
    public ResponseEntity<ErrorResponse> handleBadRequest(Exception ex, HttpServletRequest request) {
        log.debug("Bad request: {}", ex.getMessage());
        return build(ErrorCode.BAD_REQUEST, request);
    }

    @ExceptionHandler({ HttpMediaTypeNotSupportedException.class, HttpMediaTypeNotAcceptableException.class })
    public ResponseEntity<ErrorResponse> handleMediaType(Exception ex, HttpServletRequest request) {
        return build(ErrorCode.UNSUPPORTED_MEDIA_TYPE, request);
    }

    /** Vượt {@code spring.servlet.multipart.max-file-size}, vd file ghi âm shadowing. */
    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<ErrorResponse> handleUploadTooLarge(MaxUploadSizeExceededException ex,
            HttpServletRequest request) {
        return build(ErrorCode.PAYLOAD_TOO_LARGE, request);
    }

    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<ErrorResponse> handleNoResource(NoResourceFoundException ex, HttpServletRequest request) {
        return build(ErrorCode.NOT_FOUND, request);
    }

    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<ErrorResponse> handleMethodNotSupported(HttpRequestMethodNotSupportedException ex,
            HttpServletRequest request) {
        return build(ErrorCode.METHOD_NOT_ALLOWED, request);
    }

    /** Lỗi từ {@code @PreAuthorize}; lỗi phân quyền theo URL do RestAccessDeniedHandler xử lý. */
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ErrorResponse> handleAccessDenied(AccessDeniedException ex, HttpServletRequest request) {
        return build(ErrorCode.FORBIDDEN, request);
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ErrorResponse> handleDataIntegrity(DataIntegrityViolationException ex,
            HttpServletRequest request) {
        log.warn("Data integrity violation at {}: {}", request.getRequestURI(),
                ex.getMostSpecificCause().getMessage());
        return build(ErrorCode.CONFLICT, request);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleUnexpected(Exception ex, HttpServletRequest request) {
        log.error("Unhandled exception at {} {}", request.getMethod(), request.getRequestURI(), ex);
        return build(ErrorCode.INTERNAL_ERROR, request);
    }

    private ResponseEntity<ErrorResponse> validationFailed(HttpServletRequest request,
            List<ErrorResponse.FieldError> errors) {
        return build(ErrorCode.VALIDATION_FAILED, ErrorCode.VALIDATION_FAILED.getDefaultMessage(), request, errors);
    }

    private ResponseEntity<ErrorResponse> build(ErrorCode code, HttpServletRequest request) {
        return build(code, code.getDefaultMessage(), request, List.of());
    }

    private ResponseEntity<ErrorResponse> build(ErrorCode code, String message, HttpServletRequest request,
            List<ErrorResponse.FieldError> errors) {
        return ResponseEntity.status(code.getStatus())
                .body(ErrorResponse.of(code, message, request.getRequestURI(), errors));
    }
}
