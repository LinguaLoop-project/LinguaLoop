package com.lingualoop.backend.auth.service;

import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;

import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.lingualoop.backend.audit.dto.request.AuditEntryRequest;
import com.lingualoop.backend.audit.enums.AuditAction;
import com.lingualoop.backend.audit.enums.AuditEntityType;
import com.lingualoop.backend.audit.service.AuditService;
import com.lingualoop.backend.user.dto.UserAccountView;
import com.lingualoop.backend.user.service.UserAccountService;

import lombok.RequiredArgsConstructor;

/**
 * Ghi nhật ký ba sự kiện bảo mật (BR-TK-18): tạm khóa đăng nhập vì sai mật khẩu (người thực hiện là Hệ thống), đặt lại
 * và tạo hoặc đổi mật khẩu (người thực hiện là chính chủ tài khoản). Không bao giờ ghi mật khẩu hay liên kết.
 */
@Component
@RequiredArgsConstructor
class SecurityAuditor {

    private static final DateTimeFormatter VN_TIME = DateTimeFormatter.ofPattern("HH:mm dd/MM/yyyy")
            .withZone(ZoneId.of("Asia/Ho_Chi_Minh"));

    private final AuditService auditService;
    private final UserAccountService users;

    /** Email không thuộc tài khoản nào thì không ghi (BR-TK-18). */
    @Transactional
    void loginLocked(String email, Instant lockedUntil) {
        users.findByEmail(email).ifPresent(account -> auditService.record(new AuditEntryRequest(null, null, null,
                AuditAction.LOGIN_LOCKED, AuditEntityType.USER, account.id(), account.displayName(), null,
                "Sai mật khẩu nhiều lần liên tiếp, tạm khóa đăng nhập đến " + VN_TIME.format(lockedUntil))));
    }

    @Transactional
    void passwordReset(UserAccountView account) {
        bySelf(account, AuditAction.PASSWORD_RESET);
    }

    @Transactional
    void passwordChanged(UserAccountView account) {
        bySelf(account, AuditAction.PASSWORD_CHANGE);
    }

    private void bySelf(UserAccountView account, AuditAction action) {
        auditService.record(new AuditEntryRequest(account.id(), account.displayName(), account.role(), action,
                AuditEntityType.USER, account.id(), account.displayName(), null, null));
    }
}
