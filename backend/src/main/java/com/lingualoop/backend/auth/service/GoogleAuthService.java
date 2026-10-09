package com.lingualoop.backend.auth.service;

import java.util.Optional;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;

import com.lingualoop.backend.auth.dto.AuthSession;
import com.lingualoop.backend.auth.google.GoogleCodeExchanger;
import com.lingualoop.backend.auth.google.GoogleIdentity;
import com.lingualoop.backend.common.exception.BusinessException;
import com.lingualoop.backend.common.exception.ErrorCode;
import com.lingualoop.backend.user.dto.UserAccount;
import com.lingualoop.backend.user.service.UserAccountService;

import lombok.RequiredArgsConstructor;

/**
 * Đăng nhập bằng Google (UC-AUTH-03). Khác đăng nhập mật khẩu: không chịu khoá 5 lần sai và không
 * động tới bộ đếm sai mật khẩu (khoá chỉ áp dụng cho mật khẩu). Không {@code @Transactional}: mỗi bước
 * của {@link UserAccountService} tự là một transaction, nên lỗi trùng khoá khi tạo đồng thời bắt được ở đây.
 */
@Service
@RequiredArgsConstructor
public class GoogleAuthService {

    private final GoogleCodeExchanger googleCodeExchanger;
    private final UserAccountService userAccountService;
    private final RefreshTokenService refreshTokenService;
    private final AuthService authService;

    public AuthSession login(String code, String userAgent) {
        GoogleIdentity identity = googleCodeExchanger.exchange(code);
        UserAccount account = resolveAccount(identity, true);
        return authService.openSession(account, userAgent);
    }

    /**
     * Tìm theo {@code sub}, rồi theo email (liên kết), rồi tạo mới. Khoá bị chặn <b>trước</b> khi liên kết để
     * tài khoản bị khoá không bị sửa gì. {@code canRetry}: hai request cùng lúc làm trùng {@code auth_uid} hoặc
     * email thì request thua tìm lại tài khoản của request thắng, một lần.
     */
    private UserAccount resolveAccount(GoogleIdentity identity, boolean canRetry) {
        Optional<UserAccount> bySub = userAccountService.findByGoogleSub(identity.sub());
        if (bySub.isPresent()) {
            return requireEnabled(bySub.get());
        }
        Optional<UserAccount> byEmail = userAccountService.findByEmail(identity.email());
        if (byEmail.isPresent()) {
            return link(requireEnabled(byEmail.get()), identity);
        }
        try {
            return userAccountService.createFromGoogle(identity.sub(), identity.email(), identity.name(),
                    identity.picture());
        } catch (DataIntegrityViolationException e) {
            if (!canRetry) {
                throw e;
            }
            boolean someoneCreatedIt = userAccountService.findByGoogleSub(identity.sub()).isPresent()
                    || userAccountService.findByEmail(identity.email()).isPresent();
            if (!someoneCreatedIt) {
                throw e;
            }
            return resolveAccount(identity, false);
        }
    }

    private UserAccount link(UserAccount local, GoogleIdentity identity) {
        if (local.googleLinked()) {
            // đã gắn một sub khác (tìm theo sub không ra): tài khoản Google bị tạo lại với cùng email
            throw new BusinessException(ErrorCode.AUTH_GOOGLE_LINK_CONFLICT);
        }
        boolean passwordCleared = userAccountService.linkGoogle(local.id(), identity.sub());
        if (passwordCleared) {
            // email chưa từng xác thực: ai đó có thể đã đăng ký hộ bằng email này, nên mọi phiên cũ phải chết (BR-AUTH-08)
            refreshTokenService.revokeAllForUser(local.id());
        }
        return userAccountService.findById(local.id())
                .orElseThrow(() -> new IllegalStateException("User vanished while linking Google: " + local.id()));
    }

    private static UserAccount requireEnabled(UserAccount account) {
        if (account.disabled()) {
            throw new BusinessException(ErrorCode.AUTH_ACCOUNT_DISABLED);
        }
        return account;
    }
}
