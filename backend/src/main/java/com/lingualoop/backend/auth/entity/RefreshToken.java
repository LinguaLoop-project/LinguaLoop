package com.lingualoop.backend.auth.entity;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/** Một mắt xích trong chuỗi xoay vòng (family) của một lần đăng nhập; chỉ lưu hash của token. */
@Getter
@Entity
@Table(name = "auth_refresh_tokens")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class RefreshToken {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id", nullable = false, updatable = false)
    private UUID userId;

    @Column(name = "family_id", nullable = false, updatable = false)
    private UUID familyId;

    @Column(name = "token_hash", nullable = false, updatable = false)
    private String tokenHash;

    @Column(name = "expires_at", nullable = false, updatable = false)
    private Instant expiresAt;

    @Column(name = "revoked_at")
    private Instant revokedAt;

    @Column(name = "user_agent", updatable = false)
    private String userAgent;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    public static RefreshToken issue(UUID userId, UUID familyId, String tokenHash, Instant now, Instant expiresAt,
            String userAgent) {
        RefreshToken token = new RefreshToken();
        token.userId = userId;
        token.familyId = familyId;
        token.tokenHash = tokenHash;
        token.createdAt = now;
        token.expiresAt = expiresAt;
        token.userAgent = userAgent;
        return token;
    }

    public boolean isRevoked() {
        return revokedAt != null;
    }

    public boolean isExpiredAt(Instant now) {
        return !now.isBefore(expiresAt);
    }

    public void revoke(Instant now) {
        this.revokedAt = now;
    }
}
