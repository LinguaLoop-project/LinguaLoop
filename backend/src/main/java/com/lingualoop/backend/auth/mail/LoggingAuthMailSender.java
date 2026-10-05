package com.lingualoop.backend.auth.mail;

import org.springframework.stereotype.Component;

import lombok.extern.slf4j.Slf4j;

/** Stub tạm theo contract-first, được thay bằng bản gửi SMTP thật ở bước sau. Không ghi token vào log. */
@Slf4j
@Component
class LoggingAuthMailSender implements AuthMailSender {

    @Override
    public void sendVerifyEmail(String to, String uiLanguage, String rawToken) {
        log.info("[stub] would send verify-email mail to {} (lang={})", to, uiLanguage);
    }
}
