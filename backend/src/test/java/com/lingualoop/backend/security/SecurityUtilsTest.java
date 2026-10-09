package com.lingualoop.backend.security;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.UUID;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;

import com.lingualoop.backend.common.exception.BusinessException;
import com.lingualoop.backend.common.exception.ErrorCode;

class SecurityUtilsTest {

    @AfterEach
    void clearContext() {
        SecurityContextHolder.clearContext();
    }

    private void authenticateWith(Jwt.Builder builder) {
        Jwt jwt = builder.header("alg", "HS256").build();
        SecurityContextHolder.getContext().setAuthentication(new JwtAuthenticationToken(jwt));
    }

    @Test
    void currentSessionId_tokenWithSid_returnsIt_AC41() {
        UUID sid = UUID.randomUUID();
        authenticateWith(Jwt.withTokenValue("t").subject(UUID.randomUUID().toString()).claim("sid", sid.toString()));

        assertThat(SecurityUtils.currentSessionId()).contains(sid);
    }

    @Test
    void currentSessionId_tokenWithoutSid_isEmpty_AC41() {
        authenticateWith(Jwt.withTokenValue("t").subject(UUID.randomUUID().toString()));

        assertThat(SecurityUtils.currentSessionId()).isEmpty();
    }

    @Test
    void currentSessionId_malformedSid_isEmpty_AC41() {
        authenticateWith(Jwt.withTokenValue("t").subject(UUID.randomUUID().toString()).claim("sid", "not-a-uuid"));

        assertThat(SecurityUtils.currentSessionId()).isEmpty();
    }

    @Test
    void currentSessionId_noAuthentication_throwsUnauthorized() {
        assertThatThrownBy(SecurityUtils::currentSessionId)
                .isInstanceOfSatisfying(BusinessException.class,
                        e -> assertThat(e.getErrorCode()).isEqualTo(ErrorCode.UNAUTHORIZED));
    }
}
