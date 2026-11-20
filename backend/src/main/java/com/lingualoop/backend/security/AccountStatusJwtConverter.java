package com.lingualoop.backend.security;

import java.util.Optional;
import java.util.UUID;

import org.springframework.beans.factory.ObjectProvider;
import org.springframework.core.convert.converter.Converter;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.OAuth2ErrorCodes;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.stereotype.Component;

import com.lingualoop.backend.user.dto.UserAccountView;
import com.lingualoop.backend.user.service.UserAccountService;

/**
 * Đổi JWT thành Authentication và từ chối access token còn hạn của tài khoản vừa bị khóa hoặc vừa đổi vai trò
 * (BR-QT-03, BR-QT-04: có hiệu lực ngay). Token bị từ chối trả 401 {@code TOKEN_INVALID}; client làm mới phiên: tài
 * khoản bị khóa thì làm mới thất bại, tài khoản đổi vai trò thì nhận token mang vai trò mới.
 *
 * <p>Token của tài khoản không có trong cơ sở dữ liệu vẫn qua bước này; endpoint cần tài khoản tự kiểm.
 */
@Component
public class AccountStatusJwtConverter implements Converter<Jwt, AbstractAuthenticationToken> {

    private final JwtAuthenticationConverter delegate = new JwtAuthenticationConverter();
    private final ObjectProvider<UserAccountService> accounts;

    public AccountStatusJwtConverter(ObjectProvider<UserAccountService> accounts) {
        this.accounts = accounts;
        delegate.setJwtGrantedAuthoritiesConverter(SecurityConfig::roleAuthorities);
    }

    @Override
    public AbstractAuthenticationToken convert(Jwt jwt) {
        Optional<UserAccountView> account = parse(jwt.getSubject()).flatMap(id -> accounts.getObject().findById(id));
        if (account.isPresent()) {
            UserAccountView view = account.get();
            Optional<Role> claimed = Role.fromValue(jwt.getClaimAsString(JwtTokenService.ROLE_CLAIM));
            if (view.locked() || claimed.isEmpty() || claimed.get() != view.role()) {
                throw new OAuth2AuthenticationException(new OAuth2Error(OAuth2ErrorCodes.INVALID_TOKEN,
                        "Account locked or role changed", null));
            }
        }
        return delegate.convert(jwt);
    }

    private static Optional<UUID> parse(String subject) {
        try {
            return Optional.of(UUID.fromString(subject));
        } catch (IllegalArgumentException | NullPointerException e) {
            return Optional.empty();
        }
    }
}
