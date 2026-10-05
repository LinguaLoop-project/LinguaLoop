package com.lingualoop.backend.auth.mail;

/** Gửi thư của feature auth. Lỗi gửi được ném ra dưới dạng {@link RuntimeException} để caller quyết định. */
public interface AuthMailSender {

    /**
     * Gửi thư xác thực email.
     *
     * @param to         địa chỉ nhận
     * @param uiLanguage {@code vi} hoặc {@code en}, chọn ngôn ngữ thư
     * @param rawToken   token thô để đưa vào liên kết (không bao giờ ghi log)
     */
    void sendVerifyEmail(String to, String uiLanguage, String rawToken);
}
