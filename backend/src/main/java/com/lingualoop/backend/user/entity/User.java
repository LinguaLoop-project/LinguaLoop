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

    @Column(name = "auth_uid")
    private String authUid;

    @Column(nullable = false, columnDefinition = "citext")
    private String email;

    @Column(name = "display_name")
    private String displayName;

    @Column(name = "password_hash")
    private String passwordHash;

    @Column(name = "avatar_url")
    private String avatarUrl;

    @Column(name = "ui_language", nullable = false)
    private String uiLanguage = "vi";

    @Column(name = "email_verified", nullable = false)
    private boolean emailVerified;

    @Column(nullable = false)
    private boolean disabled;

    @Convert(converter = RoleConverter.class)
    @Column(nullable = false)
    private Role role = Role.STUDENT;

    @Column(name = "onboarded_at")
    private Instant onboardedAt;

    @Column(name = "terms_accepted_at")
    private Instant termsAcceptedAt;

    public static User createLocal(String email, String displayName, String passwordHash, Instant termsAcceptedAt) {
        User user = new User();
        user.email = email;
        user.displayName = displayName;
        user.passwordHash = passwordHash;
        user.termsAcceptedAt = termsAcceptedAt;
        return user;
    }

    /** Tài khoản tạo lần đầu từ Google: email đã được Google xác thực, chưa có mật khẩu, chưa đồng ý điều khoản. */
    public static User createFromGoogle(String sub, String email, String displayName, String avatarUrl) {
        User user = new User();
        user.authUid = sub;
        user.email = email;
        user.displayName = displayName;
        user.avatarUrl = avatarUrl;
        user.emailVerified = true;
        return user;
    }

    /**
     * Gắn tài khoản với Google. Nếu email trước đó chưa xác thực thì bỏ mật khẩu: người đăng ký cục bộ
     * chưa chứng minh sở hữu email thì không được giữ đường đăng nhập bằng mật khẩu (BR-AUTH-08).
     *
     * @return {@code true} nếu mật khẩu đã bị xoá (caller phải thu hồi mọi phiên)
     */
    public boolean linkGoogle(String sub) {
        boolean clearPassword = !emailVerified;
        this.authUid = sub;
        this.emailVerified = true;
        if (clearPassword) {
            this.passwordHash = null;
        }
        return clearPassword;
    }

    public void changePassword(String passwordHash) {
        this.passwordHash = passwordHash;
    }

    public void markEmailVerified() {
        this.emailVerified = true;
    }

    public boolean isOnboarded() {
        return onboardedAt != null;
    }

    public boolean hasPassword() {
        return passwordHash != null;
    }
}
