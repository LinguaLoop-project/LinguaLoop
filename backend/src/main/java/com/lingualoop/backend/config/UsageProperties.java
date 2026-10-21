package com.lingualoop.backend.config;

import java.time.ZoneId;

import org.springframework.boot.context.properties.ConfigurationProperties;

/** Bind từ {@code app.usage}: múi giờ quyết định lúc hạn mức theo ngày bắt đầu lại. */
@ConfigurationProperties("app.usage")
public record UsageProperties(ZoneId zone) {

    public UsageProperties {
        zone = zone == null ? ZoneId.of("Asia/Ho_Chi_Minh") : zone;
    }
}
