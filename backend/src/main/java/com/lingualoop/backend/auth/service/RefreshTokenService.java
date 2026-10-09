package com.lingualoop.backend.auth.service;

import java.time.Clock;
import java.time.Instant;
import java.util.Optional;
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

    /** Mở chuỗi mới cho một lần đăng nhập: trả mã chuỗi (đưa vào claim {@code sid}) và token thô (chỉ đặt vào cookie). */
    public Session startSession(UUID userId, String userAgent) {
        UUID familyId = UUID.randomUUID();
        String raw = transactionTemplate.execute(status -> issue(userId, familyId, userAgent));
        return new Session(familyId, raw);
    }

    /** Đổi token cũ lấy token mới; ném {@link RefreshInvalidException} nếu không hợp lệ. */
    public Rotation rotate(String rawToken, String userAgent) {
        Optional<Rotation> rotation = transactionTemplate.execute(status -> doRotate(rawToken, userAgent));
        return rotation.orElseThrow(RefreshInvalidException::new);
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

    /** Thu hồi mọi phiên của người dùng (vd khi mật khẩu bị xoá lúc liên kết Google). */
    public void revokeAllForUser(UUID userId) {
        transactionTemplate.executeWithoutResult(status -> repository.revokeAllByUser(userId, Instant.now(clock)));
    }

    /** Thu hồi mọi phiên của người dùng trừ phiên {@code keepFamilyId}; {@code null} nghĩa là không giữ phiên nào. */
    public void revokeAllExcept(UUID userId, UUID keepFamilyId) {
        if (keepFamilyId == null) {
            revokeAllForUser(userId);
            return;
        }
        transactionTemplate.executeWithoutResult(
                status -> repository.revokeAllByUserExceptFamily(userId, keepFamilyId, Instant.now(clock)));
    }

    /** Rỗng nghĩa là token không dùng được (việc thu hồi family nếu có vẫn được commit). */
    private Optional<Rotation> doRotate(String rawToken, String userAgent) {
        if (rawToken == null || rawToken.isBlank()) {
            return Optional.empty();
        }
        RefreshToken token = repository.findByTokenHash(SecureTokens.sha256(rawToken)).orElse(null);
        Instant now = Instant.now(clock);
        if (token == null || token.isExpiredAt(now)) {
            return Optional.empty();
        }
        if (token.isRevoked()) {
            // Ân hạn cho nhiều tab refresh cùng lúc: chỉ khi vừa bị thu hồi VÀ chuỗi vẫn còn token đang sống.
            // Chuỗi đã bị đăng xuất/thu hồi hết thì không còn ân hạn.
            boolean withinGrace = !token.getRevokedAt().plus(authProperties.refreshReuseGrace()).isBefore(now);
            if (!withinGrace || !repository.hasActiveToken(token.getFamilyId(), now)) {
                repository.revokeFamily(token.getFamilyId(), now);
                return Optional.empty();
            }
        } else {
            token.revoke(now);
        }
        String next = issue(token.getUserId(), token.getFamilyId(), userAgent);
        return Optional.of(new Rotation(token.getUserId(), token.getFamilyId(), next));
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

    /** Phiên mới mở: mã chuỗi và token thô để đặt vào cookie. */
    public record Session(UUID familyId, String rawToken) {
    }

    /** Kết quả xoay vòng: người dùng, chuỗi và token thô mới để đặt vào cookie. */
    public record Rotation(UUID userId, UUID familyId, String rawToken) {
    }
}
