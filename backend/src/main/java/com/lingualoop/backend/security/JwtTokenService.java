package com.lingualoop.backend.security;

import java.time.Clock;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Service;

/**
 * Cấp access token cho người dùng đã xác thực. Feature {@code auth} gọi service này
 * sau khi kiểm tra mật khẩu.
 */
@Service
public class JwtTokenService {

    public static final String ROLE_CLAIM = "role";

    /** Mã phiên đăng nhập (= family_id của refresh token), để biết "thiết bị hiện tại" khi đổi mật khẩu. */
    public static final String SESSION_CLAIM = "sid";

    private final JwtEncoder jwtEncoder;
    private final JwtProperties props;
    private final Clock clock;

    @Autowired
    public JwtTokenService(JwtEncoder jwtEncoder, JwtProperties props) {
        this(jwtEncoder, props, Clock.systemUTC());
    }

    JwtTokenService(JwtEncoder jwtEncoder, JwtProperties props, Clock clock) {
        this.jwtEncoder = jwtEncoder;
        this.props = props;
        this.clock = clock;
    }

    public AccessToken issueAccessToken(UUID userId, Role role, UUID sessionId) {
        // JWT lưu thời gian theo giây; cắt trước để expiresAt trả về khớp claim exp.
        Instant now = clock.instant().truncatedTo(ChronoUnit.SECONDS);
        Instant expiresAt = now.plus(props.accessTokenTtl());
        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer(props.issuer())
                .subject(userId.toString())
                .issuedAt(now)
                .expiresAt(expiresAt)
                .claim(ROLE_CLAIM, role.value())
                .claim(SESSION_CLAIM, sessionId.toString())
                .build();
        JwsHeader header = JwsHeader.with(MacAlgorithm.HS256).build();
        String token = jwtEncoder.encode(JwtEncoderParameters.from(header, claims)).getTokenValue();
        return new AccessToken(token, expiresAt);
    }

    public record AccessToken(String token, Instant expiresAt) {
    }
}
