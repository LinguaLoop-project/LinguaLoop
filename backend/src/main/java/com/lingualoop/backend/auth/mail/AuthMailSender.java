package com.lingualoop.backend.auth.mail;

/** Gửi thư của feature auth. Lỗi gửi được ném ra dưới dạng {@link RuntimeException} để caller quyết định. */
public interface AuthMailSender {

    void sendVerifyEmail(String to, String uiLanguage, String rawToken);
}
