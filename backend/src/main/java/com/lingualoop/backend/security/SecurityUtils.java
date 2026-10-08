package com.lingualoop.backend.security;

import java.util.Optional;
import java.util.UUID;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;

import com.lingualoop.backend.common.exception.BusinessException;
import com.lingualoop.backend.common.exception.ErrorCode;

/** Lấy người dùng hiện tại từ JWT. Trong controller ưu tiên dùng {@link CurrentUserId}. */
public final class SecurityUtils {

    private SecurityUtils() {
    }

    public static UUID currentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof Jwt jwt) {
            String subject = jwt.getSubject();
            if (subject == null) {
                throw new BusinessException(ErrorCode.TOKEN_INVALID);
            }
            try {
                return UUID.fromString(subject);
            } catch (IllegalArgumentException e) {
                throw new BusinessException(ErrorCode.TOKEN_INVALID);
            }
        }
        throw new BusinessException(ErrorCode.UNAUTHORIZED);
    }

    /** Mã phiên trong claim {@code sid}; rỗng nếu token cũ không có hoặc giá trị hỏng. */
    public static Optional<UUID> currentSessionId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof Jwt jwt) {
            String sid = jwt.getClaimAsString(JwtTokenService.SESSION_CLAIM);
            if (sid == null) {
                return Optional.empty();
            }
            try {
                return Optional.of(UUID.fromString(sid));
            } catch (IllegalArgumentException e) {
                return Optional.empty();
            }
        }
        throw new BusinessException(ErrorCode.UNAUTHORIZED);
    }
}
