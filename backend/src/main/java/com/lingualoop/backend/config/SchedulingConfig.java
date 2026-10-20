package com.lingualoop.backend.config;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;

/** Bật các job nền (hiện có job dọn phiên gia sư). Tắt bằng {@code app.scheduling.enabled=false}, vd trong test. */
@Configuration
@EnableScheduling
@ConditionalOnProperty(name = "app.scheduling.enabled", havingValue = "true", matchIfMissing = true)
class SchedulingConfig {
}
