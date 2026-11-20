package com.lingualoop.backend.user.dto;

import java.util.UUID;

/** Phát trong giao dịch khóa tài khoản để feature {@code auth} kết thúc mọi phiên đăng nhập (BR-QT-03). */
public record UserLockedEvent(UUID userId) {
}
