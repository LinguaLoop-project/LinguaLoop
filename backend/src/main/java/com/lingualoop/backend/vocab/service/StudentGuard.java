package com.lingualoop.backend.vocab.service;

import java.util.UUID;

import org.springframework.stereotype.Component;

import com.lingualoop.backend.common.exception.BusinessException;
import com.lingualoop.backend.common.exception.ErrorCode;
import com.lingualoop.backend.security.Role;
import com.lingualoop.backend.user.dto.UserAccountView;
import com.lingualoop.backend.user.service.UserAccountService;

import lombok.RequiredArgsConstructor;

/** Bộ từ cá nhân chỉ dành cho học viên; giáo viên và quản trị viên soạn bộ ở phần quản lý riêng (UC-HT-08, UC-HT-09). */
@Component
@RequiredArgsConstructor
class StudentGuard {

    private final UserAccountService users;

    /** Không có tài khoản thì 401, tài khoản không phải học viên thì 403. */
    void require(UUID userId) {
        UserAccountView user = users.findById(userId).orElseThrow(() -> new BusinessException(ErrorCode.UNAUTHORIZED));
        if (user.role() != Role.STUDENT) {
            throw new BusinessException(ErrorCode.FORBIDDEN);
        }
    }
}
