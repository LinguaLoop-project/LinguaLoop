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

/** Token một lần gửi qua email (xác thực email, đặt lại mật khẩu); chỉ lưu hash của token. */
@Getter
@Entity
@Table(name = "auth_email_tokens")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class EmailToken {

    public static final String VERIFY_EMAIL = "verify_email";
    public static final String RESET_PASSWORD = "reset_password";

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id", nullable = false, updatable = false)
    private UUID userId;

    @Column(nullable = false, updatable = false)
    private String purpose;

    @Column(name = "token_hash", nullable = false, updatable = false)
    private String tokenHash;

    @Column(name = "expires_at", nullable = false, updatable = false)
    private Instant expiresAt;

    @Column(name = "used_at")
    private Instant usedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    public static EmailToken issue(UUID userId, String purpose, String tokenHash, Instant now, Instant expiresAt) {
        EmailToken token = new EmailToken();
        token.userId = userId;
        token.purpose = purpose;
        token.tokenHash = tokenHash;
        token.createdAt = now;
        token.expiresAt = expiresAt;
        return token;
    }
}
