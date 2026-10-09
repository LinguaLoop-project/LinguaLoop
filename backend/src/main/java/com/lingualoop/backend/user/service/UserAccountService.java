package com.lingualoop.backend.user.service;

import java.util.Optional;
import java.util.UUID;

import com.lingualoop.backend.user.dto.UserAccount;

/** Cổng duy nhất để feature khác (auth) đọc/ghi tài khoản */
public interface UserAccountService {

    Optional<UserAccount> findByEmail(String email);

    Optional<UserAccount> findById(UUID id);

    UserAccount createLocal(String email, String displayName, String passwordHash);

    void markEmailVerified(UUID userId);

    Optional<UserAccount> findByGoogleSub(String sub);

    /** Tạo học viên mới từ Google: email đã xác thực, chưa mật khẩu, chưa đồng ý điều khoản. */
    UserAccount createFromGoogle(String sub, String email, String name, String pictureUrl);

    /**
     * Gắn Google {@code sub} vào tài khoản email đã có.
     *
     * @return {@code true} nếu mật khẩu bị xoá vì email chưa từng được xác thực (caller thu hồi mọi phiên)
     */
    boolean linkGoogle(UUID userId, String sub);

    void updatePasswordHash(UUID userId, String passwordHash);
}
