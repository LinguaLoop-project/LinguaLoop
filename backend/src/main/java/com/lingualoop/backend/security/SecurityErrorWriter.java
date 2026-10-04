package com.lingualoop.backend.security;

import java.io.IOException;

import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;

import com.lingualoop.backend.common.exception.ErrorCode;
import com.lingualoop.backend.common.exception.ErrorResponse;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import tools.jackson.databind.ObjectMapper;

/** Ghi lỗi 401/403 phát sinh trong filter chain theo cùng định dạng {@link ErrorResponse}. */
@Component
@RequiredArgsConstructor
class SecurityErrorWriter {

    private final ObjectMapper objectMapper;

    void write(HttpServletRequest request, HttpServletResponse response, ErrorCode code) throws IOException {
        response.setStatus(code.getStatus().value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");
        ErrorResponse body = ErrorResponse.of(code, code.getDefaultMessage(), request.getRequestURI());
        objectMapper.writeValue(response.getOutputStream(), body);
    }
}
