package com.lingualoop.backend.auth.google;

import java.util.Set;
import java.util.function.Predicate;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2TokenValidatorResult;
import org.springframework.security.oauth2.jose.jws.SignatureAlgorithm;
import org.springframework.security.oauth2.jwt.BadJwtException;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.security.oauth2.jwt.JwtTimestampValidator;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import com.lingualoop.backend.common.exception.BusinessException;
import com.lingualoop.backend.common.exception.ErrorCode;
import com.lingualoop.backend.config.GoogleProperties;

/**
 * Xác minh ID token do Google Identity Services cấp, bằng JWKS công khai của Google
 * (không cần client secret). Token hỏng, sai {@code aud}/{@code iss}, hết hạn hoặc email chưa
 * xác thực thì ném {@link ErrorCode#AUTH_GOOGLE_TOKEN_INVALID}; không tải được JWKS thì ném
 * {@link GoogleUnavailableException}.
 */
@Component
public class GoogleIdTokenVerifier {

    private static final Logger log = LoggerFactory.getLogger(GoogleIdTokenVerifier.class);
    private static final Set<String> ISSUERS = Set.of("accounts.google.com", "https://accounts.google.com");

    private final NimbusJwtDecoder decoder;

    public GoogleIdTokenVerifier(GoogleProperties props) {
        if (props.configured()) {
            this.decoder = buildDecoder(props);
        } else {
            log.warn("app.google.client-id chưa cấu hình: đăng nhập Google tạm thời không dùng được");
            this.decoder = null;
        }
    }

    private static NimbusJwtDecoder buildDecoder(GoogleProperties props) {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(props.timeout());
        factory.setReadTimeout(props.timeout());

        NimbusJwtDecoder decoder = NimbusJwtDecoder.withJwkSetUri(props.jwkSetUri())
                .jwsAlgorithm(SignatureAlgorithm.RS256)
                .restOperations(new RestTemplate(factory))
                .build();
        decoder.setJwtValidator(new DelegatingOAuth2TokenValidator<>(
                new JwtTimestampValidator(),
                claim("iss", jwt -> ISSUERS.contains(jwt.getClaimAsString("iss"))),
                claim("aud", jwt -> jwt.getAudience() != null && jwt.getAudience().contains(props.clientId())),
                claim("email_verified", jwt -> Boolean.TRUE.equals(jwt.getClaimAsBoolean("email_verified"))),
                claim("email", jwt -> {
                    String email = jwt.getClaimAsString("email");
                    return email != null && !email.isBlank();
                })));
        return decoder;
    }

    private static OAuth2TokenValidator<Jwt> claim(String name, Predicate<Jwt> ok) {
        return jwt -> ok.test(jwt)
                ? OAuth2TokenValidatorResult.success()
                : OAuth2TokenValidatorResult.failure(new OAuth2Error("invalid_token", "Claim không hợp lệ: " + name, null));
    }

    public GoogleIdentity verify(String idToken) {
        if (decoder == null) {
            throw new GoogleUnavailableException("Chưa cấu hình Google client ID");
        }
        Jwt jwt;
        try {
            jwt = decoder.decode(idToken);
        } catch (BadJwtException e) {
            // chỉ log lý do, không log token
            log.debug("ID token Google bị từ chối: {}", e.getMessage());
            throw new BusinessException(ErrorCode.AUTH_GOOGLE_TOKEN_INVALID);
        } catch (JwtException e) {
            // JwtException không phải BadJwtException: lỗi hạ tầng (tải JWKS thất bại, timeout)
            log.warn("Không tải được JWKS của Google: {}", e.getMessage());
            throw new GoogleUnavailableException("Không tải được khoá công khai của Google", e);
        }
        return new GoogleIdentity(jwt.getSubject(), jwt.getClaimAsString("email"),
                jwt.getClaimAsString("name"), jwt.getClaimAsString("picture"));
    }
}
