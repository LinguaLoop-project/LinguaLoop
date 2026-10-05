package com.lingualoop.backend.auth.service;

import java.time.Clock;
import java.time.Instant;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;

import com.lingualoop.backend.auth.entity.RefreshToken;
import com.lingualoop.backend.auth.repository.RefreshTokenRepository;
import com.lingualoop.backend.config.AuthProperties;

import lombok.RequiredArgsConstructor;

/**
 * Refresh token xoay vòng theo chuỗi (family). Mỗi lần dùng, token cũ bị thu hồi và token mới cùng family
 * được cấp với hạn trượt 30 ngày (BR-AUTH-07). Dùng lại token đã thu hồi quá lâu là dấu hiệu bị trộm nên
 * cả family bị thu hồi.
 *
 * <p>Việc thu hồi phải commit rồi mới báo lỗi, nên các method dùng {@link TransactionTemplate} và ném
 * exception ngoài transaction thay vì {@code @Transactional} (rollback sẽ huỷ luôn việc thu hồi).
 */
@Service
@RequiredArgsConstructor
public class RefreshTokenService {

    private static final int MAX_USER_AGENT_LENGTH = 512;

    private final RefreshTokenRepository repository;
    private final AuthProperties authProperties;
    private final Clock clock;
    private final TransactionTemplate transactionTemplate;

    /** Mở chuỗi mới cho một lần đăng nhập, trả về token thô (chỉ đặt vào cookie). */
    public String startSession(UUID userId, String userAgent) {
        return transactionTemplate.execute(status -> issue(userId, UUID.randomUUID(), userAgent));
    }

    /** Đổi token cũ lấy token mới; ném {@link RefreshInvalidException} nếu không hợp lệ. */
    public Rotation rotate(String rawToken, String userAgent) {
        Rotation rotation = transactionTemplate.execute(status -> doRotate(rawToken, userAgent));
        if (rotation == null) {
            throw new RefreshInvalidException();
        }
        return rotation;
    }

    /** Đăng xuất: thu hồi cả chuỗi chứa token này. Token lạ hoặc rỗng thì bỏ qua. */
    public void revokeSession(String rawToken) {
        if (rawToken == null || rawToken.isBlank()) {
            return;
        }
        transactionTemplate.executeWithoutResult(status -> repository
                .findByTokenHash(SecureTokens.sha256(rawToken))
                .ifPresent(token -> repository.revokeFamily(token.getFamilyId(), Instant.now(clock))));
    }

    public void revokeFamily(UUID familyId) {
        transactionTemplate.executeWithoutResult(status -> repository.revokeFamily(familyId, Instant.now(clock)));
    }

    /** {@code null} nghĩa là token không dùng được (việc thu hồi family nếu có vẫn được commit). */
    private Rotation doRotate(String rawToken, String userAgent) {
        if (rawToken == null || rawToken.isBlank()) {
            return null;
        }
        RefreshToken token = repository.findByTokenHash(SecureTokens.sha256(rawToken)).orElse(null);
        Instant now = Instant.now(clock);
        if (token == null || token.isExpiredAt(now)) {
            return null;
        }
        if (token.isRevoked()) {
            // Ân hạn cho nhiều tab refresh cùng lúc: chỉ khi vừa bị thu hồi VÀ chuỗi vẫn còn token đang sống.
            // Chuỗi đã bị đăng xuất/thu hồi hết thì không còn ân hạn.
            boolean withinGrace = !token.getRevokedAt().plus(authProperties.refreshReuseGrace()).isBefore(now);
            if (!withinGrace || !repository.hasActiveToken(token.getFamilyId(), now)) {
                repository.revokeFamily(token.getFamilyId(), now);
                return null;
            }
        } else {
            token.revoke(now);
        }
        String next = issue(token.getUserId(), token.getFamilyId(), userAgent);
        return new Rotation(token.getUserId(), token.getFamilyId(), next);
    }

    private String issue(UUID userId, UUID familyId, String userAgent) {
        String raw = SecureTokens.generate();
        Instant now = Instant.now(clock);
        repository.save(RefreshToken.issue(userId, familyId, SecureTokens.sha256(raw), now,
                now.plus(authProperties.refreshTokenTtl()), truncate(userAgent)));
        return raw;
    }

    private static String truncate(String userAgent) {
        if (userAgent == null || userAgent.length() <= MAX_USER_AGENT_LENGTH) {
            return userAgent;
        }
        return userAgent.substring(0, MAX_USER_AGENT_LENGTH);
    }

    /** Kết quả xoay vòng: người dùng, chuỗi và token thô mới để đặt vào cookie. */
    public record Rotation(UUID userId, UUID familyId, String rawToken) {
    }
}
