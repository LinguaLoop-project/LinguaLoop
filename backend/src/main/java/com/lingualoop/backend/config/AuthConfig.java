package com.lingualoop.backend.config;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/** Đăng ký {@link AuthProperties} (cấu hình {@code app.auth.*}). */
@Configuration
@EnableConfigurationProperties(AuthProperties.class)
public class AuthConfig {
}
