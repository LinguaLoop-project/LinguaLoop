package com.lingualoop.backend.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;

/** Bật {@code @Async}; dùng {@code applicationTaskExecutor} mặc định của Spring Boot (gửi thư không chặn request). */
@Configuration
@EnableAsync
public class AsyncConfig {
}
