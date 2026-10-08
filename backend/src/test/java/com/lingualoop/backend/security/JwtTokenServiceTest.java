package com.lingualoop.backend.security;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.UUID;

import javax.crypto.SecretKey;

import org.junit.jupiter.api.Test;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtException;

class JwtTokenServiceTest {

    // Sinh lúc chạy thay vì viết chuỗi cố định, để Gitleaks không coi là secret thật.
    private static final String SECRET = "a".repeat(40);

    private final JwtConfig config = new JwtConfig();

    @Test
    void issuedTokenDecodesWithSubjectRoleAndExpiry() {
        JwtProperties props = new JwtProperties(SECRET, "lingualoop", Duration.ofMinutes(30));
        SecretKey key = config.jwtSecretKey(props);
        JwtTokenService service = new JwtTokenService(config.jwtEncoder(key), props);
        UUID userId = UUID.randomUUID();
        UUID sessionId = UUID.randomUUID();

        JwtTokenService.AccessToken token = service.issueAccessToken(userId, Role.INSTRUCTOR, sessionId);
        Jwt jwt = config.jwtDecoder(key, props).decode(token.token());

        assertThat(jwt.getSubject()).isEqualTo(userId.toString());
        assertThat(jwt.getClaimAsString(JwtTokenService.ROLE_CLAIM)).isEqualTo("instructor");
        assertThat(jwt.getClaimAsString(JwtTokenService.SESSION_CLAIM)).isEqualTo(sessionId.toString());
        assertThat(jwt.getExpiresAt()).isEqualTo(token.expiresAt());
        assertThat(SecurityConfig.roleAuthorities(jwt))
                .extracting(Object::toString)
                .containsExactly("ROLE_INSTRUCTOR");
    }

    @Test
    void tokenIssuedWithoutSessionHasNoSidClaim() {
        JwtProperties props = new JwtProperties(SECRET, "lingualoop", Duration.ofMinutes(30));
        SecretKey key = config.jwtSecretKey(props);
        JwtTokenService service = new JwtTokenService(config.jwtEncoder(key), props);

        Jwt jwt = config.jwtDecoder(key, props)
                .decode(service.issueAccessToken(UUID.randomUUID(), Role.STUDENT, null).token());

        assertThat(jwt.hasClaim(JwtTokenService.SESSION_CLAIM)).isFalse();
    }

    @Test
    void tokenSignedWithOtherSecretIsRejected() {
        JwtProperties props = new JwtProperties(SECRET, "lingualoop", Duration.ofMinutes(30));
        JwtProperties other = new JwtProperties("b".repeat(40), "lingualoop",
                Duration.ofMinutes(30));
        String token = tokenFor(other);

        JwtDecoder decoder = config.jwtDecoder(config.jwtSecretKey(props), props);

        assertThatThrownBy(() -> decoder.decode(token)).isInstanceOf(JwtException.class);
    }

    @Test
    void tokenFromOtherIssuerIsRejected() {
        JwtProperties props = new JwtProperties(SECRET, "lingualoop", Duration.ofMinutes(30));
        String token = tokenFor(new JwtProperties(SECRET, "someone-else", Duration.ofMinutes(30)));

        JwtDecoder decoder = config.jwtDecoder(config.jwtSecretKey(props), props);

        assertThatThrownBy(() -> decoder.decode(token)).isInstanceOf(JwtException.class);
    }

    @Test
    void expiredTokenIsRejected() {
        JwtProperties props = new JwtProperties(SECRET, "lingualoop", Duration.ofMinutes(5));
        SecretKey key = config.jwtSecretKey(props);
        Clock anHourAgo = Clock.fixed(Instant.now().minus(Duration.ofHours(1)), ZoneOffset.UTC);
        String token = new JwtTokenService(config.jwtEncoder(key), props, anHourAgo)
                .issueAccessToken(UUID.randomUUID(), Role.STUDENT, UUID.randomUUID()).token();

        JwtDecoder decoder = config.jwtDecoder(key, props);

        assertThatThrownBy(() -> decoder.decode(token)).isInstanceOf(JwtException.class);
    }

    @Test
    void unknownRoleClaimGivesNoAuthorities() {
        Jwt jwt = Jwt.withTokenValue("t").header("alg", "HS256").subject("x").claim("role", "hacker").build();

        assertThat(SecurityConfig.roleAuthorities(jwt)).isEmpty();
    }

    private String tokenFor(JwtProperties props) {
        return new JwtTokenService(config.jwtEncoder(config.jwtSecretKey(props)), props)
                .issueAccessToken(UUID.randomUUID(), Role.STUDENT, UUID.randomUUID()).token();
    }
}
