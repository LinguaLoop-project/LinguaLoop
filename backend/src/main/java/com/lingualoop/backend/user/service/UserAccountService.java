package com.lingualoop.backend.user.service;

import java.util.Optional;
import java.util.UUID;

import com.lingualoop.backend.user.dto.UserAccountView;
import com.lingualoop.backend.user.dto.response.MeResponse;

/** Cổng duy nhất để feature khác (auth) đọc/ghi tài khoản */
public interface UserAccountService {

    Optional<UserAccountView> findByEmail(String email);

    Optional<UserAccountView> findById(UUID id);

    UserAccountView createLocal(String email, String displayName, String passwordHash);

    void markEmailVerified(UUID userId);

    Optional<UserAccountView> findByGoogleSub(String sub);

    /** Tạo học viên mới từ Google: email đã xác thực, chưa mật khẩu, chưa đồng ý điều khoản. */
    UserAccountView createFromGoogle(String sub, String email, String name, String pictureUrl);

    /**
     * Gắn Google {@code sub} vào tài khoản email đã có.
     *
     * @return {@code true} nếu mật khẩu bị xoá vì email chưa từng được xác thực (caller thu hồi mọi phiên)
     */
    boolean linkGoogle(UUID userId, String sub);

    void updatePasswordHash(UUID userId, String passwordHash);

    /**
     * Lưu hồ sơ học tập của học viên (UC-TK-08 và tab Học tập trong Cài đặt). Lần đầu thành công thì đánh dấu đã
     * thiết lập hồ sơ. {@code acceptTerms} bắt buộc khi học viên chưa từng đồng ý điều khoản (BR-TK-14).
     */
    UserAccountView saveLearningProfile(UUID userId, String displayName, int dailyMinutes, String uiLanguage,
            String timezone, boolean acceptTerms);

    /** Hồ sơ trả cho client từ bản chụp tài khoản. */
    MeResponse toMe(UserAccountView account);
}
