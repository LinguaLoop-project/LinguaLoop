package com.lingualoop.backend.config;

import org.springframework.context.MessageSource;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.support.ResourceBundleMessageSource;

/**
 * Nguồn câu chữ phía server (hiện là thư gửi người dùng), theo {@code messages_<lang>.properties}.
 * Tự khai báo vì Boot chỉ tự đăng ký khi có {@code messages.properties} gốc, mà ở đây mỗi
 * ngôn ngữ có file riêng; tắt fallback theo locale của máy chủ để không gửi nhầm ngôn ngữ.
 */
@Configuration
public class MessageConfig {

    @Bean
    public MessageSource messageSource() {
        ResourceBundleMessageSource source = new ResourceBundleMessageSource();
        source.setBasename("messages");
        source.setDefaultEncoding("UTF-8");
        source.setFallbackToSystemLocale(false);
        return source;
    }
}
