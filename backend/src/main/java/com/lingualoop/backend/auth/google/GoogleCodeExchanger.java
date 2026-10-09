package com.lingualoop.backend.auth.google;

import org.springframework.http.HttpStatusCode;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;

import com.lingualoop.backend.common.exception.BusinessException;
import com.lingualoop.backend.common.exception.ErrorCode;
import com.lingualoop.backend.config.GoogleProperties;

import feign.FeignException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Authorization code flow với Google: đổi {@code code} lấy access token (kèm client secret), rồi gọi userinfo
 * để lấy {@link GoogleIdentity}. Code sai/hết hạn/đã dùng, hoặc email Google chưa xác thực thì ném
 * {@link ErrorCode#AUTH_GOOGLE_TOKEN_INVALID}; Google không phản hồi, lỗi 5xx, hoặc cấu hình sai
 * (thiếu client ID/secret, Google từ chối client) thì ném {@link GoogleUnavailableException}.
 * Không log code, access token hay secret.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class GoogleCodeExchanger {

    private final GoogleProperties props;
    private final GoogleTokenClient tokenClient;
    private final GoogleUserInfoClient userInfoClient;

    public GoogleIdentity exchange(String code) {
        if (!props.configured()) {
            log.warn("app.google.client-id/client-secret not configured: Google sign-in is unavailable");
            throw new GoogleUnavailableException("Google client ID/secret not configured");
        }
        String accessToken = fetchAccessToken(code);
        GoogleUserInfo info = fetchUserInfo(accessToken);

        boolean usable = info != null && info.sub() != null && !info.sub().isBlank()
                && info.email() != null && !info.email().isBlank()
                && Boolean.TRUE.equals(info.emailVerified());
        if (!usable) {
            throw new BusinessException(ErrorCode.AUTH_GOOGLE_TOKEN_INVALID);
        }
        return new GoogleIdentity(info.sub(), info.email(), info.name(), info.picture());
    }

    private String fetchAccessToken(String code) {
        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("code", code);
        form.add("client_id", props.clientId());
        form.add("client_secret", props.clientSecret());
        form.add("redirect_uri", props.redirectUri());
        form.add("grant_type", "authorization_code");
        GoogleTokenResponse response;
        try {
            response = tokenClient.exchange(form);
        } catch (FeignException e) {
            throw translate("token exchange", e, true);
        }
        if (response == null || response.accessToken() == null || response.accessToken().isBlank()) {
            throw new BusinessException(ErrorCode.AUTH_GOOGLE_TOKEN_INVALID);
        }
        return response.accessToken();
    }

    private GoogleUserInfo fetchUserInfo(String accessToken) {
        try {
            return userInfoClient.getUserInfo("Bearer " + accessToken);
        } catch (FeignException e) {
            // access token vừa nhận mà bị từ chối là bất thường, không phải lỗi của người dùng
            throw translate("userinfo", e, false);
        }
    }

    /**
     * 400 khi đổi code ({@code invalid_grant}) là lỗi của người dùng; mọi lỗi còn lại (kể cả 401 {@code invalid_client}
     * do secret sai, timeout, 5xx) là phía hệ thống nên trả "không khả dụng" và ghi log để người vận hành thấy.
     */
    private BusinessException translate(String step, FeignException e, boolean badRequestIsUserError) {
        HttpStatusCode status = HttpStatusCode.valueOf(e.status() > 0 ? e.status() : 503);
        if (badRequestIsUserError && status.value() == 400) {
            log.debug("Google rejected the authorization code");
            return new BusinessException(ErrorCode.AUTH_GOOGLE_TOKEN_INVALID);
        }
        log.warn("Google call failed ({}): status={} {}", step, e.status(), e.getClass().getSimpleName());
        return new GoogleUnavailableException("Could not reach Google (" + step + ")", e);
    }
}
