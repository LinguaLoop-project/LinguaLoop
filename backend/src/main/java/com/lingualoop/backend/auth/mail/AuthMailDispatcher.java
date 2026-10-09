package com.lingualoop.backend.auth.mail;

import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

import com.lingualoop.backend.user.dto.UserAccount;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Gửi thư ở luồng nền để thời gian phản hồi không phụ thuộc SMTP.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class AuthMailDispatcher {

    private final AuthMailSender authMailSender;

    @Async
    public void sendVerifyEmail(UserAccount account, String rawToken) {
        try {
            authMailSender.sendVerifyEmail(account.email(), account.uiLanguage(), rawToken);
        } catch (RuntimeException e) {
            log.warn("Could not send verification mail to user {}", account.id(), e);
        }
    }
}
