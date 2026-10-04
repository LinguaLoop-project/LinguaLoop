package com.lingualoop.backend.security;

import java.io.IOException;

import org.springframework.security.core.AuthenticationException;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

import com.lingualoop.backend.common.exception.ErrorCode;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;

/** 401: thiếu token thì {@code UNAUTHORIZED}, token sai hoặc hết hạn thì {@code TOKEN_INVALID}. */
@Component
@RequiredArgsConstructor
public class RestAuthenticationEntryPoint implements AuthenticationEntryPoint {

    private final SecurityErrorWriter errorWriter;

    @Override
    public void commence(HttpServletRequest request, HttpServletResponse response,
            AuthenticationException authException) throws IOException {
        ErrorCode code = authException instanceof OAuth2AuthenticationException
                ? ErrorCode.TOKEN_INVALID
                : ErrorCode.UNAUTHORIZED;
        errorWriter.write(request, response, code);
    }
}
