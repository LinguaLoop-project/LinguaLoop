package com.lingualoop.backend.config;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/** Đăng ký {@link AuthProperties} ({@code app.auth.*}) và {@link GoogleProperties} ({@code app.google.*}). */
@Configuration
@EnableConfigurationProperties({ AuthProperties.class, GoogleProperties.class })
public class AuthConfig {
}
