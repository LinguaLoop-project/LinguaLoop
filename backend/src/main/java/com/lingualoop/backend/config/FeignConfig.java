package com.lingualoop.backend.config;

import org.springframework.cloud.openfeign.EnableFeignClients;
import org.springframework.context.annotation.Configuration;

/** Bật Feign cho các client gọi dịch vụ ngoài; hiện chỉ có Google ({@code auth/google}). */
@Configuration
@EnableFeignClients(basePackages = "com.lingualoop.backend.auth.google")
public class FeignConfig {
}
