package com.lingualoop.backend.user.entity;

import java.time.Instant;

import com.lingualoop.backend.common.entity.BaseEntity;
import com.lingualoop.backend.security.Role;

import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Entity
@Table(name = "users")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class User extends BaseEntity {

    @Column(name = "google_sub")
    private String googleSub;

    @Column(nullable = false, columnDefinition = "citext")
    private String email;

    @Column(name = "display_name", nullable = false)
    private String displayName;

    @Column(name = "password_hash")
    private String passwordHash;

    @Column(name = "avatar_url")
    private String avatarUrl;

    @Convert(converter = RoleAttributeConverter.class)
    @Column(nullable = false)
    private Role role = Role.STUDENT;

    @Column(name = "email_verified_at")
    private Instant emailVerifiedAt;

    @Column(name = "terms_accepted_at")
    private Instant termsAcceptedAt;

    @Column(name = "onboarded_at")
    private Instant onboardedAt;

    @Column(name = "daily_minutes", nullable = false)
    private short dailyMinutes = 15;

    @Column(name = "ui_language", nullable = false)
    private String uiLanguage = "vi";

    @Column(nullable = false)
    private String timezone = "Asia/Ho_Chi_Minh";

    @Column(name = "locked_at")
    private Instant lockedAt;

    @Column(name = "locked_reason")
    private String lockedReason;

    public static User createLocal(String email, String displayName, String passwordHash, Instant termsAcceptedAt) {
        User user = new User();
        user.email = email;
        user.displayName = displayName;
        user.passwordHash = passwordHash;
        user.termsAcceptedAt = termsAcceptedAt;
        return user;
    }

    /** Tài khoản tạo lần đầu từ Google: email đã được Google xác thực, chưa có mật khẩu, chưa đồng ý điều khoản. */
    public static User createFromGoogle(String sub, String email, String displayName, String avatarUrl, Instant now) {
        User user = new User();
        user.googleSub = sub;
        user.email = email;
        user.displayName = displayName;
        user.avatarUrl = avatarUrl;
        user.emailVerifiedAt = now;
        return user;
    }

    /**
     * Gắn tài khoản với Google. Nếu email trước đó chưa xác thực thì bỏ mật khẩu: người đăng ký cục bộ
     * chưa chứng minh sở hữu email thì không được giữ đường đăng nhập bằng mật khẩu.
     *
     * @return {@code true} nếu mật khẩu đã bị xoá (caller phải thu hồi mọi phiên)
     */
    public boolean linkGoogle(String sub, Instant now) {
        boolean clearPassword = !isEmailVerified();
        this.googleSub = sub;
        if (clearPassword) {
            this.emailVerifiedAt = now;
            this.passwordHash = null;
        }
        return clearPassword;
    }

    public void changePassword(String passwordHash) {
        this.passwordHash = passwordHash;
    }

    public void markEmailVerified(Instant now) {
        if (emailVerifiedAt == null) {
            this.emailVerifiedAt = now;
        }
    }

    public boolean isEmailVerified() {
        return emailVerifiedAt != null;
    }

    public boolean isLocked() {
        return lockedAt != null;
    }

    public boolean isOnboarded() {
        return onboardedAt != null;
    }

    public boolean hasPassword() {
        return passwordHash != null;
    }
}
