package com.lingualoop.backend.auth.google;

import static com.github.tomakehurst.wiremock.client.WireMock.aResponse;
import static com.github.tomakehurst.wiremock.client.WireMock.get;
import static com.github.tomakehurst.wiremock.client.WireMock.urlEqualTo;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.Duration;
import java.time.Instant;
import java.util.Date;
import java.util.UUID;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import com.github.tomakehurst.wiremock.WireMockServer;
import com.github.tomakehurst.wiremock.core.WireMockConfiguration;
import com.lingualoop.backend.common.exception.BusinessException;
import com.lingualoop.backend.common.exception.ErrorCode;
import com.lingualoop.backend.config.GoogleProperties;
import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.JWSHeader;
import com.nimbusds.jose.crypto.RSASSASigner;
import com.nimbusds.jose.jwk.JWKSet;
import com.nimbusds.jose.jwk.RSAKey;
import com.nimbusds.jose.jwk.gen.RSAKeyGenerator;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;

/** Xác minh ID token Google bằng JWKS giả dựng trên WireMock (AC-17, AC-22, AC-23). */
class GoogleIdTokenVerifierTest {

    private static final String CLIENT_ID = "test-client.apps.googleusercontent.com";
    private static final String KID = "test-key-1";

    private WireMockServer wireMock;
    private RSAKey signingKey;

    @BeforeEach
    void setUp() throws Exception {
        signingKey = new RSAKeyGenerator(2048).keyID(KID).generate();
        wireMock = new WireMockServer(WireMockConfiguration.options().dynamicPort());
        wireMock.start();
        stubJwks(signingKey);
    }

    @AfterEach
    void tearDown() {
        wireMock.stop();
    }

    private void stubJwks(RSAKey key) {
        wireMock.stubFor(get(urlEqualTo("/certs")).willReturn(aResponse()
                .withHeader("Content-Type", "application/json")
                .withBody(new JWKSet(key.toPublicJWK()).toString())));
    }

    private GoogleIdTokenVerifier verifier(String clientId, Duration timeout) {
        return new GoogleIdTokenVerifier(new GoogleProperties(clientId, wireMock.baseUrl() + "/certs", timeout));
    }

    private GoogleIdTokenVerifier verifier() {
        return verifier(CLIENT_ID, Duration.ofSeconds(2));
    }

    private JWTClaimsSet.Builder validClaims() {
        Instant now = Instant.now();
        return new JWTClaimsSet.Builder()
                .issuer("https://accounts.google.com")
                .audience(CLIENT_ID)
                .subject("google-sub-123")
                .issueTime(Date.from(now))
                .expirationTime(Date.from(now.plusSeconds(3600)))
                .claim("email", "minh@gmail.com")
                .claim("email_verified", true)
                .claim("name", "Minh Nguyen")
                .claim("picture", "https://lh3.googleusercontent.com/a/minh");
    }

    private String sign(JWTClaimsSet claims, RSAKey key) throws Exception {
        SignedJWT jwt = new SignedJWT(
                new JWSHeader.Builder(JWSAlgorithm.RS256).keyID(key.getKeyID()).build(), claims);
        jwt.sign(new RSASSASigner(key));
        return jwt.serialize();
    }

    private void assertInvalid(String token) {
        assertThatThrownBy(() -> verifier().verify(token))
                .isInstanceOfSatisfying(BusinessException.class,
                        e -> assertThat(e.getErrorCode()).isEqualTo(ErrorCode.AUTH_GOOGLE_TOKEN_INVALID));
    }

    @Test
    void verify_validToken_returnsIdentity_AC17() throws Exception {
        GoogleIdentity identity = verifier().verify(sign(validClaims().build(), signingKey));

        assertThat(identity.sub()).isEqualTo("google-sub-123");
        assertThat(identity.email()).isEqualTo("minh@gmail.com");
        assertThat(identity.name()).isEqualTo("Minh Nguyen");
        assertThat(identity.picture()).isEqualTo("https://lh3.googleusercontent.com/a/minh");
    }

    @Test
    void verify_issuerWithoutScheme_isAccepted_AC17() throws Exception {
        String token = sign(validClaims().issuer("accounts.google.com").build(), signingKey);

        assertThat(verifier().verify(token).sub()).isEqualTo("google-sub-123");
    }

    @Test
    void verify_noNameNoPicture_returnsNulls_AC18() throws Exception {
        JWTClaimsSet claims = new JWTClaimsSet.Builder(validClaims().build())
                .claim("name", null).claim("picture", null).build();

        GoogleIdentity identity = verifier().verify(sign(claims, signingKey));

        assertThat(identity.name()).isNull();
        assertThat(identity.picture()).isNull();
    }

    @Test
    void verify_wrongAudience_isInvalid_AC22() throws Exception {
        assertInvalid(sign(validClaims().audience("other-client").build(), signingKey));
    }

    @Test
    void verify_wrongIssuer_isInvalid_AC22() throws Exception {
        assertInvalid(sign(validClaims().issuer("https://evil.example.com").build(), signingKey));
    }

    @Test
    void verify_expiredToken_isInvalid_AC22() throws Exception {
        Instant past = Instant.now().minusSeconds(600);
        assertInvalid(sign(validClaims()
                .issueTime(Date.from(past.minusSeconds(3600)))
                .expirationTime(Date.from(past)).build(), signingKey));
    }

    @Test
    void verify_signedWithOtherKey_isInvalid_AC22() throws Exception {
        RSAKey attacker = new RSAKeyGenerator(2048).keyID(KID).generate();

        assertInvalid(sign(validClaims().build(), attacker));
    }

    @Test
    void verify_emailNotVerified_isInvalid_AC22() throws Exception {
        assertInvalid(sign(validClaims().claim("email_verified", false).build(), signingKey));
    }

    @Test
    void verify_emailVerifiedMissing_isInvalid_AC22() throws Exception {
        assertInvalid(sign(validClaims().claim("email_verified", null).build(), signingKey));
    }

    @Test
    void verify_missingEmail_isInvalid_AC22() throws Exception {
        assertInvalid(sign(validClaims().claim("email", null).build(), signingKey));
    }

    @Test
    void verify_garbageToken_isInvalid_AC22() {
        assertInvalid("not-a-jwt");
        assertInvalid(UUID.randomUUID().toString());
    }

    @Test
    void verify_jwksReturns500_isUnavailable_AC23() throws Exception {
        wireMock.stubFor(get(urlEqualTo("/certs")).willReturn(aResponse().withStatus(500)));
        String token = sign(validClaims().build(), signingKey);

        assertThatThrownBy(() -> verifier().verify(token)).isInstanceOf(GoogleUnavailableException.class);
    }

    @Test
    void verify_jwksTooSlow_isUnavailable_AC23() throws Exception {
        wireMock.stubFor(get(urlEqualTo("/certs")).willReturn(aResponse()
                .withFixedDelay(3000).withBody(new JWKSet(signingKey.toPublicJWK()).toString())));
        String token = sign(validClaims().build(), signingKey);

        assertThatThrownBy(() -> verifier(CLIENT_ID, Duration.ofMillis(300)).verify(token))
                .isInstanceOf(GoogleUnavailableException.class);
    }

    @Test
    void verify_clientIdNotConfigured_isUnavailable_AC23() throws Exception {
        String token = sign(validClaims().build(), signingKey);

        assertThatThrownBy(() -> verifier("", Duration.ofSeconds(2)).verify(token))
                .isInstanceOf(GoogleUnavailableException.class);
    }
}
