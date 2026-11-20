package com.lingualoop.backend.auth.service;

import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import com.lingualoop.backend.user.dto.UserLockedEvent;

import lombok.RequiredArgsConstructor;

/**
 * Kết thúc mọi phiên đăng nhập khi quản trị viên khóa tài khoản (BR-QT-03). Chạy đồng bộ trong giao dịch khóa, nên
 * khóa thất bại thì các phiên cũng không bị thu hồi. Access token còn hạn bị chặn ở {@code security}.
 */
@Component
@RequiredArgsConstructor
class AccountLockListener {

    private final RefreshTokenService refreshTokenService;

    @EventListener
    void onUserLocked(UserLockedEvent event) {
        refreshTokenService.revokeAllForUser(event.userId());
    }
}
